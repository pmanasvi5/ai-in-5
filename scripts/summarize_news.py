"""Turns a ranked, deduplicated article into a fully-qualified NewsStory:
a short "quick scoop" hook, a one-line "why it matters," and up to five key
takeaways — written like a knowledgeable friend explaining something
interesting, not a press release.

Two summarizers are available:

1. Gemini (optional): if GEMINI_API_KEY is set, calls the Gemini API free
   tier, grounding the prompt strictly in the fetched article text and
   instructing the model never to add outside facts, never to open with a
   cliched AI-news phrase, and to vary its opening style by category.
   Output is validated; if the model returns something malformed or
   generic, the story falls back to (2).
2. Extractive fallback (always available, no API, no cost): builds the
   quick scoop and takeaways only from sentences that actually appear in
   the fetched headline/description, trimmed to the target length rather
   than reworded. It never invents specifics about the story, and if there
   isn't enough real text to extract a genuinely useful quick scoop plus at
   least two distinct takeaways, the story is rejected rather than padded
   with filler.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

from common import (
    BANNED_OPENINGS,
    CATEGORY_OPENING_HINTS,
    estimate_reading_minutes,
    now_iso,
    slugify,
    starts_with_banned_opening,
)

MIN_TAKEAWAY_SENTENCES = 2
QUICK_SCOOP_MIN_WORDS = 25
QUICK_SCOOP_MAX_WORDS = 40
TAKEAWAY_MAX_WORDS = 16

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

WHY_IT_MATTERS_BY_CATEGORY = {
    "New Models": "New models like this tend to show up inside the everyday apps and tools people already use.",
    "Tools & Apps": "Tools like this change what ordinary people and workers can do day to day, no technical skill required.",
    "Company News": "Moves by major AI companies shape which products get built, funded, and widely adopted next.",
    "Business & Work": "Changes like this can ripple into jobs, hiring, and how companies operate, even outside tech.",
    "Policy & Regulation": "Rules like this shape what AI companies can do, and how much protection the public gets.",
    "Safety & Security": "Safety issues like this affect how much people can trust AI with sensitive tasks and decisions.",
    "Research": "Research like this often takes years to reach real products, but it signals where AI is headed.",
    "Health & Education": "AI in health and education can directly touch care and learning for a huge number of people.",
}

BOILERPLATE_PATTERNS = [
    "sign up here", "subscribe", "originally appeared in", "weekly newsletter",
    "daily newsletter", "in your inbox", "read the full story", "this is today's edition",
    "find out how", "find out why", "find out what", "follow along below",
]

# Newsletter roundups (e.g. "The Download") often tack a byline onto the
# last sentence of an excerpt with no real sentence break, like
# "...for decades. —Casey Crownhart" -- strip that trailing fragment.
TRAILING_BYLINE_RE = re.compile(r"\s+—\s*[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,2}$")

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")


def _normalize_apostrophes(text: str) -> str:
    return text.replace("’", "'").replace("‘", "'")


def split_sentences(text: str) -> list[str]:
    text = text.strip()
    if not text:
        return []
    parts = SENTENCE_SPLIT_RE.split(text)
    sentences = [TRAILING_BYLINE_RE.sub("", p.strip()) for p in parts]
    sentences = [s for s in sentences if len(s) > 20]
    return [
        s for s in sentences
        if not any(pat in _normalize_apostrophes(s.lower()) for pat in BOILERPLATE_PATTERNS)
    ]


def trim_to_word_budget(text: str, max_words: int) -> str:
    """Trims to at most max_words, always marking a mid-sentence cut with an
    ellipsis. A heuristic that tried to land on a comma/dash instead was
    tried and dropped: it sometimes produced a fragment that *looked*
    grammatically complete but wasn't (e.g. cutting "their own off-grid,"
    down to "their own off-grid."), which is more misleading than an
    honest ellipsis, not less.
    """
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]).rstrip(".,;:") + "…"


def build_quick_scoop(sentences: list[str]) -> tuple[str, int]:
    """Returns (quick_scoop, how many leading sentences it consumed)."""
    scoop = sentences[0]
    consumed = 1
    if len(scoop.split()) < QUICK_SCOOP_MIN_WORDS and len(sentences) > 1:
        scoop = f"{scoop} {sentences[1]}"
        consumed = 2
    if starts_with_banned_opening(scoop) and len(sentences) > consumed:
        # Vanishingly unlikely from real journalist text, but cheap to guard.
        scoop = sentences[consumed]
        consumed += 1
    return trim_to_word_budget(scoop, QUICK_SCOOP_MAX_WORDS), consumed


def extractive_summarize(article: dict) -> dict | None:
    sentences = split_sentences(article["raw_text"])
    headline_norm = article["headline"].lower()
    sentences = [s for s in sentences if s.lower()[:30] not in headline_norm]

    if len(sentences) < MIN_TAKEAWAY_SENTENCES + 1:
        return None

    quick_scoop, consumed = build_quick_scoop(sentences)
    remaining = sentences[consumed:]
    if len(remaining) < MIN_TAKEAWAY_SENTENCES:
        return None

    takeaways = [trim_to_word_budget(s, TAKEAWAY_MAX_WORDS) for s in remaining[:5]]
    why_it_matters = WHY_IT_MATTERS_BY_CATEGORY.get(
        article["category"],
        "Developments like this shape how AI tools evolve and who gets access to them.",
    )
    return {"quickScoop": quick_scoop, "whyItMatters": why_it_matters, "takeaways": takeaways}


def call_gemini(article: dict) -> dict | None:
    if not GEMINI_API_KEY:
        return None

    opening_hint = CATEGORY_OPENING_HINTS.get(article["category"], "Lead with the single most interesting verified fact.")
    banned_list = "; ".join(f'"{p}"' for p in BANNED_OPENINGS)

    prompt = f"""You are a sharp, curious friend explaining AI news to someone smart but non-technical — not a press release, not a textbook.
Using ONLY the information in the SOURCE MATERIAL below, write a JSON object with:
- "quickScoop": 25-40 words (2-3 short sentences) that hook the reader with the most interesting verified fact first, then the key detail. Conversational, concrete, no hedging filler.
- "whyItMatters": one short sentence on why an everyday reader should care. Only draw a real-world connection the source material actually supports.
- "fiveKeyTakeaways": an array of 3 to 5 short, DISTINCT facts (8-16 words each) not already fully covered by quickScoop. Never pad to reach 5 — fewer true facts beats a repeated or filler one.

Style rules:
- {opening_hint}
- Never open quickScoop with any of these cliches: {banned_list}.
- No corporate hedging ("aims to", "is poised to", "represents a significant step").
- Explain any jargon in plain words instead of using the term bare.
- Do not add any fact, name, number, or claim not present in the SOURCE MATERIAL.
- Do not speculate about the future beyond what the source supports.
- If the SOURCE MATERIAL doesn't support a genuinely useful quickScoop, respond with {{"quickScoop": "", "whyItMatters": "", "fiveKeyTakeaways": []}} instead of guessing.

HEADLINE: {article['headline']}

SOURCE MATERIAL:
{article['raw_text']}

Respond with ONLY the JSON object, no markdown formatting."""

    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 500},
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

    quick_scoop = parsed.get("quickScoop", "")
    why_it_matters = parsed.get("whyItMatters", "")
    takeaways = parsed.get("fiveKeyTakeaways", [])

    if not isinstance(quick_scoop, str) or not (10 <= len(quick_scoop.split()) <= 60):
        return None
    if starts_with_banned_opening(quick_scoop):
        return None
    if not isinstance(why_it_matters, str) or not why_it_matters.strip():
        return None
    if not isinstance(takeaways, list) or not (3 <= len(takeaways) <= 5):
        return None
    if not all(isinstance(t, str) and 3 <= len(t.split()) <= 22 for t in takeaways):
        return None

    return {
        "quickScoop": quick_scoop.strip(),
        "whyItMatters": why_it_matters.strip(),
        "takeaways": [t.strip() for t in takeaways],
    }


def summarize_article(article: dict) -> dict | None:
    result = None
    if GEMINI_API_KEY:
        result = call_gemini(article)
        if result:
            article["_summarizer"] = "gemini"
        time.sleep(1)  # be gentle with the free-tier rate limit between calls

    if not result:
        result = extractive_summarize(article)
        if not result:
            return None
        article["_summarizer"] = "extractive"

    story = {
        "id": slugify(article["headline"]) or f"story-{abs(hash(article['link']))}",
        "headline": article["headline"],
        "source": article["source"],
        "originalUrl": article["link"],
        "category": article["category"],
        "publishedAt": article["published_iso"],
        "fetchedAt": article["fetched_iso"],
        "quickScoop": result["quickScoop"],
        "summary": result["takeaways"],
        "whyItMatters": result["whyItMatters"],
        "keyTerms": article.get("key_terms", []),
        "readingTimeMinutes": estimate_reading_minutes(result["takeaways"], result["whyItMatters"], result["quickScoop"]),
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
