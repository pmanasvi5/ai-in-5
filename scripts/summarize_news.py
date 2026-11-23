"""Turns a ranked, deduplicated article into a fully-qualified NewsStory:
five beginner-friendly bullet points plus a "why it matters" line.

Two summarizers are available:

1. Gemini (optional): if GEMINI_API_KEY is set, calls the Gemini API free
   tier, grounding the prompt strictly in the fetched article text and
   instructing the model never to add outside facts. Output is validated;
   if the model returns something malformed, the story falls back to (2).
2. Extractive fallback (always available, no API, no cost): builds bullets
   only from sentences that actually appear in the fetched headline/
   description, plus a template-based "why it matters" line keyed off the
   story's category. It never invents specifics about the story. If there
   isn't enough real text to extract a useful set of bullets, the story is
   rejected rather than padded with filler.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

from common import estimate_reading_minutes, now_iso, slugify

MIN_SENTENCES_FOR_EXTRACTIVE = 2
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

WHY_IT_MATTERS_BY_CATEGORY = {
    "New Models": "New AI models often end up inside the everyday apps and tools people already use, so their abilities set what's possible next.",
    "Tools & Apps": "Tools like this change what ordinary people and workers can do with AI day to day, often without needing any technical skill.",
    "Company News": "Moves by major AI companies shape which tools get built, funded, and widely adopted next.",
    "Business & Work": "Changes like this can affect jobs, hiring, and how companies operate, which matters even if you don't work in tech.",
    "Policy & Regulation": "Rules like this shape what AI companies are allowed to do, and how much protection and transparency the public gets.",
    "Safety & Security": "Safety issues like this affect how much people can trust AI systems with sensitive tasks and decisions.",
    "Research": "Research like this often takes months or years to reach real products, but it signals where AI capabilities are heading next.",
    "Health & Education": "AI in health and education can directly affect care and learning for a very large number of people.",
}

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")

# Newsletter/CTA boilerplate that shows up in RSS summaries but carries no
# actual story content, so it should never be extracted as a "fact" bullet.
BOILERPLATE_PATTERNS = [
    "sign up here", "subscribe", "originally appeared in", "weekly newsletter",
    "daily newsletter", "in your inbox", "read the full story", "this is today's edition",
]


def _normalize_apostrophes(text: str) -> str:
    return text.replace("’", "'").replace("‘", "'")


def split_sentences(text: str) -> list[str]:
    text = text.strip()
    if not text:
        return []
    parts = SENTENCE_SPLIT_RE.split(text)
    sentences = [p.strip() for p in parts if len(p.strip()) > 20]
    return [
        s for s in sentences
        if not any(pat in _normalize_apostrophes(s.lower()) for pat in BOILERPLATE_PATTERNS)
    ]


def extractive_bullets(article: dict) -> list[str] | None:
    sentences = split_sentences(article["raw_text"])
    # Drop sentences that just restate the headline almost verbatim.
    headline_norm = article["headline"].lower()
    sentences = [s for s in sentences if s.lower()[:30] not in headline_norm]

    if len(sentences) < MIN_SENTENCES_FOR_EXTRACTIVE:
        return None

    source_line = f"This was reported by {article['source']}; the original article has the full details and is linked below."

    # The headline is already shown as the card title in the UI, so it only
    # fills a bullet slot when there isn't enough real body text to do better.
    if len(sentences) >= 4:
        bullets = sentences[:4] + [source_line]
    else:
        bullets = [f"{article['headline'].rstrip('.')}."] + sentences[:3] + [source_line]

    # Need at least 2 substantive, distinct body sentences (beyond the
    # headline and the source-attribution line) for this to be a genuinely
    # useful summary rather than padding.
    if len(sentences) < 2:
        return None

    return bullets[:5]


def extractive_why_it_matters(article: dict) -> str:
    return WHY_IT_MATTERS_BY_CATEGORY.get(
        article["category"],
        "Developments like this shape how AI tools evolve and who gets access to them.",
    )


def call_gemini(article: dict) -> dict | None:
    if not GEMINI_API_KEY:
        return None

    prompt = f"""You are a careful news editor writing for readers who are new to AI.
Using ONLY the information in the SOURCE MATERIAL below, write a JSON object with:
- "bullets": an array of EXACTLY 5 short, plain-English bullet points (1-2 sentences each) that together answer: what happened, important details, what it means, who is affected, and why an ordinary person should care.
- "whyItMatters": one short sentence on why this matters to an everyday reader.

Rules:
- Do not add any fact, name, number, or claim that is not present in the SOURCE MATERIAL.
- Do not speculate about the future beyond what the source material supports.
- Use everyday language, no jargon without a plain explanation.
- If the SOURCE MATERIAL does not contain enough information to honestly fill 5 distinct, meaningful bullets, respond with {{"bullets": [], "whyItMatters": ""}} instead of guessing.

HEADLINE: {article['headline']}

SOURCE MATERIAL:
{article['raw_text']}

Respond with ONLY the JSON object, no markdown formatting."""

    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600},
        }
    ).encode("utf-8")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"  [gemini] request failed, falling back: {exc}", file=sys.stderr)
        return None

    try:
        text = payload["candidates"][0]["content"]["parts"][0]["text"]
        text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        print(f"  [gemini] malformed response, falling back: {exc}", file=sys.stderr)
        return None

    bullets = parsed.get("bullets", [])
    why = parsed.get("whyItMatters", "")
    if not isinstance(bullets, list) or len(bullets) != 5 or not all(isinstance(b, str) and b.strip() for b in bullets):
        return None
    if not isinstance(why, str) or not why.strip():
        return None
    return {"bullets": [b.strip() for b in bullets], "whyItMatters": why.strip()}


def summarize_article(article: dict) -> dict | None:
    result = None
    if GEMINI_API_KEY:
        result = call_gemini(article)
        if result:
            article["_summarizer"] = "gemini"
        time.sleep(1)  # be gentle with the free-tier rate limit between calls

    if not result:
        bullets = extractive_bullets(article)
        if not bullets:
            return None
        result = {"bullets": bullets, "whyItMatters": extractive_why_it_matters(article)}
        article["_summarizer"] = "extractive"

    story = {
        "id": slugify(article["headline"]) or f"story-{abs(hash(article['link']))}",
        "headline": article["headline"],
        "source": article["source"],
        "originalUrl": article["link"],
        "category": article["category"],
        "publishedAt": article["published_iso"],
        "fetchedAt": article["fetched_iso"],
        "summary": result["bullets"],
        "whyItMatters": result["whyItMatters"],
        "keyTerms": article.get("key_terms", []),
        "readingTimeMinutes": estimate_reading_minutes(result["bullets"], result["whyItMatters"]),
    }
    return story


def main():
    with open("ranked_stories.json", "r", encoding="utf-8") as f:
        candidates = json.load(f)

    stories = []
    rejected = 0
    for article in candidates:
        story = summarize_article(article)
        if story:
            stories.append(story)
        else:
            rejected += 1
            print(f"  [reject] insufficient source material: {article['headline'][:70]}", file=sys.stderr)

    print(f"Summarized {len(stories)} stories ({rejected} rejected for insufficient grounding)")

    with open("summarized_stories.json", "w", encoding="utf-8") as f:
        json.dump(stories, f, indent=2)
    print("Wrote summarized_stories.json")


if __name__ == "__main__":
    main()
