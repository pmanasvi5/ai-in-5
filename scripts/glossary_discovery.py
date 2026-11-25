"""Grows the glossary over time by "discovering" terms that today's actual
news mentions, instead of relying on one fixed, finite word bank.

Two sources of new terms, both grounded rather than invented:

1. A hand-authored seed pool (public/data/glossary-seed-pool.json) of
   accurate, human-written entries that haven't gone live yet. When a
   story mentions one of these terms by name, it's promoted into the live
   glossary. This is the free, zero-risk path: every definition was
   written carefully ahead of time, so there's no chance of an AI
   confidently inventing a wrong one — growth is gated by real relevance,
   not randomness.
2. Gemini (optional, only if GEMINI_API_KEY is set): asks the model to
   name truly new AI terms appearing in today's stories that aren't in the
   glossary or the seed pool, with strict grounding and validation. If the
   model can't confidently identify any, or returns something malformed,
   nothing is added -- this path never runs when the pool above already
   covers what's needed, since that's the safer default.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request

from common import DATA_DIR, slugify, tag_key_terms

SEED_POOL_PATH = DATA_DIR / "glossary-seed-pool.json"
GLOSSARY_PATH = DATA_DIR / "glossary.json"

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
MAX_GEMINI_DISCOVERIES_PER_DAY = 3


def _load(path):
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write(path, data) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _story_text(story: dict) -> str:
    parts = [story.get("headline", ""), story.get("quickScoop", ""), story.get("whyItMatters", "")]
    parts.extend(story.get("summary", []))
    return " ".join(parts)


def _mentions_term(text: str, term: str) -> bool:
    pattern = r"(?<![\w-])" + re.escape(term.lower()) + r"(?![\w-])"
    return bool(re.search(pattern, text.lower()))


def promote_from_seed_pool(stories: list[dict], glossary: list[dict], seed_pool: list[dict]) -> list[dict]:
    """Returns the list of entries promoted into the live glossary this run."""
    combined_text = " ".join(_story_text(s) for s in stories)
    promoted = []
    remaining_pool = []
    for entry in seed_pool:
        if _mentions_term(combined_text, entry["term"]):
            promoted.append(entry)
        else:
            remaining_pool.append(entry)

    if promoted:
        glossary.extend(promoted)
        seed_pool[:] = remaining_pool

    return promoted


def _gemini_discover(stories: list[dict], known_terms: set[str]) -> list[dict]:
    if not GEMINI_API_KEY:
        return []

    stories_text = "\n\n".join(f"- {s['headline']}: {_story_text(s)}" for s in stories)
    known_list = ", ".join(sorted(known_terms))

    prompt = f"""You help maintain a beginner-friendly AI glossary. Below are today's AI news stories.
List up to {MAX_GEMINI_DISCOVERIES_PER_DAY} AI/ML terms mentioned in these stories that are NOT already in this existing glossary list: {known_list}

Only include a term if:
- It's genuinely an AI/ML technical or industry term (not a company or product name).
- You are confident about its well-established, widely-agreed meaning.
- A beginner reading today's news would benefit from a plain-English definition.

For each term, respond with a JSON array of objects, each with exactly these fields:
- "term": the term's common name
- "definition": one beginner-friendly sentence, plain English, no jargon
- "everydayExample": one concrete, realistic example
- "whyItMatters": one sentence on why it matters

If you aren't confident about any term meeting all these bars, respond with an empty array: []

TODAY'S STORIES:
{stories_text}

Respond with ONLY the JSON array, no markdown formatting."""

    body = json.dumps(
        {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.2, "maxOutputTokens": 700}}
    ).encode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        text = payload["candidates"][0]["content"]["parts"][0]["text"]
        text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(text)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError, IndexError, json.JSONDecodeError) as exc:
        print(f"  [glossary-discovery] Gemini call failed, skipping: {exc}", file=sys.stderr)
        return []

    if not isinstance(parsed, list):
        return []

    validated = []
    for item in parsed[:MAX_GEMINI_DISCOVERIES_PER_DAY]:
        if not isinstance(item, dict):
            continue
        required = ("term", "definition", "everydayExample", "whyItMatters")
        if not all(isinstance(item.get(k), str) and item.get(k, "").strip() for k in required):
            continue
        term_id = slugify(item["term"])
        if not term_id or term_id in known_terms:
            continue
        validated.append(
            {
                "id": term_id,
                "term": item["term"].strip(),
                "definition": item["definition"].strip(),
                "everydayExample": item["everydayExample"].strip(),
                "whyItMatters": item["whyItMatters"].strip(),
                "relatedTerms": [],
            }
        )
    return validated


def discover_and_update_glossary(stories: list[dict]) -> list[dict]:
    """Updates public/data/glossary.json and glossary-seed-pool.json on
    disk, re-tags each story's keyTerms against the (possibly grown)
    glossary, and returns the updated stories list."""
    glossary = _load(GLOSSARY_PATH)
    seed_pool = _load(SEED_POOL_PATH)
    known_ids = {t["id"] for t in glossary}

    promoted = promote_from_seed_pool(stories, glossary, seed_pool)
    if promoted:
        print(f"  [glossary-discovery] promoted from seed pool: {[t['term'] for t in promoted]}")

    known_ids = {t["id"] for t in glossary}
    discovered = _gemini_discover(stories, known_ids)
    if discovered:
        glossary.extend(discovered)
        print(f"  [glossary-discovery] discovered via Gemini: {[t['term'] for t in discovered]}")

    if promoted or discovered:
        _write(GLOSSARY_PATH, glossary)
        _write(SEED_POOL_PATH, seed_pool)

    for story in stories:
        story["keyTerms"] = tag_key_terms(_story_text(story), glossary)

    return stories
