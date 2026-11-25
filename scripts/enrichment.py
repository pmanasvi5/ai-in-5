"""Generates the smaller, optional pieces of each day's digest: the Daily
AI Challenge, the AI in Real Life activity, and per-story "Explain It
Simpler" text. All are designed to work with zero extra API calls by
default, with an optional Gemini path for richer output.
"""
from __future__ import annotations

import json
import os
import random
import re
import sys
import urllib.error
import urllib.request

from common import DATA_DIR, slugify

ACTIVITIES_PATH = DATA_DIR / "activities.json"

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()


def _date_hash(date_str: str) -> int:
    h = 5381
    for ch in date_str:
        h = (h * 33) ^ ord(ch)
    return h & 0xFFFFFFFF


def select_daily_activity(digest_date: str) -> dict | None:
    """Deterministically rotates through the activity bank by date, so
    every visitor sees the same activity on a given day and it cycles
    through the whole bank before repeating."""
    if not ACTIVITIES_PATH.exists():
        return None
    activities = json.loads(ACTIVITIES_PATH.read_text(encoding="utf-8"))
    if not activities:
        return None
    index = _date_hash(digest_date) % len(activities)
    return activities[index]


def _gemini_generate_challenge(stories: list[dict], featured_term: dict | None) -> dict | None:
    if not GEMINI_API_KEY:
        return None

    stories_text = "\n\n".join(f"- {s['headline']}: {s.get('quickScoop', '')}" for s in stories)
    term_text = f"\n\nToday's featured AI term: {featured_term['term']} - {featured_term['definition']}" if featured_term else ""

    prompt = f"""Write ONE multiple-choice question (4 options) that tests understanding of today's AI news or the featured term below.
The question must be answerable using ONLY the information given here -- do not require outside knowledge.
Respond with a JSON object: {{"question": "...", "choices": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "..."}}
The explanation should be one sentence reinforcing the correct answer. Keep everything beginner-friendly, no jargon without explanation.

TODAY'S STORIES:
{stories_text}{term_text}

Respond with ONLY the JSON object, no markdown formatting."""

    body = json.dumps(
        {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.3, "maxOutputTokens": 400}}
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
        print(f"  [enrichment] Gemini challenge generation failed, falling back: {exc}", file=sys.stderr)
        return None

    choices = parsed.get("choices")
    if (
        not isinstance(parsed.get("question"), str) or not parsed["question"].strip()
        or not isinstance(choices, list) or len(choices) != 4
        or not all(isinstance(c, str) and c.strip() for c in choices)
        or not isinstance(parsed.get("correctIndex"), int) or not (0 <= parsed["correctIndex"] < 4)
        or not isinstance(parsed.get("explanation"), str) or not parsed["explanation"].strip()
    ):
        return None

    return {
        "question": parsed["question"].strip(),
        "choices": [c.strip() for c in choices],
        "correctIndex": parsed["correctIndex"],
        "explanation": parsed["explanation"].strip(),
    }


def _deterministic_challenge(glossary: list[dict], candidate_term_ids: list[str], digest_date: str) -> dict | None:
    """Builds a question entirely from human-authored glossary definitions:
    "Which definition matches <term>?" with 3 wrong definitions drawn from
    other glossary terms. Zero fabrication risk since every answer choice
    is real, reviewed glossary content."""
    if len(glossary) < 4:
        return None

    by_id = {t["id"]: t for t in glossary}
    pool = [by_id[tid] for tid in candidate_term_ids if tid in by_id] or glossary
    rng = random.Random(_date_hash(digest_date))
    correct = rng.choice(pool)

    distractor_pool = [t for t in glossary if t["id"] != correct["id"]]
    rng.shuffle(distractor_pool)
    distractors = distractor_pool[:3]
    if len(distractors) < 3:
        return None

    choices = [correct["definition"]] + [d["definition"] for d in distractors]
    order = list(range(4))
    rng.shuffle(order)
    shuffled_choices = [choices[i] for i in order]
    correct_index = order.index(0)

    return {
        "id": f"challenge-{digest_date}",
        "digestDate": digest_date,
        "question": f'Which of these is the best definition of "{correct["term"]}"?',
        "choices": shuffled_choices,
        "correctIndex": correct_index,
        "explanation": f"{correct['definition']} {correct['whyItMatters']}",
        "sourceTermId": correct["id"],
    }


def build_daily_challenge(stories: list[dict], glossary: list[dict], candidate_term_ids: list[str], digest_date: str, featured_term: dict | None = None) -> dict | None:
    generated = _gemini_generate_challenge(stories, featured_term)
    if generated:
        return {
            "id": f"challenge-{digest_date}",
            "digestDate": digest_date,
            **generated,
        }
    return _deterministic_challenge(glossary, candidate_term_ids, digest_date)


SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")


def _gemini_simplify(quick_scoop: str) -> str | None:
    if not GEMINI_API_KEY:
        return None
    prompt = f"""Rewrite this in 1-2 shorter, simpler sentences a complete beginner could follow. Use everyday words, no jargon. Do not add any new facts or claims -- only simplify what's here.
If you can't simplify it without losing meaning or adding anything, respond with exactly: SKIP

TEXT: {quick_scoop}"""
    body = json.dumps(
        {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.2, "maxOutputTokens": 150}}
    ).encode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        text = payload["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError, IndexError) as exc:
        print(f"  [enrichment] Gemini simplify failed, falling back: {exc}", file=sys.stderr)
        return None
    if not text or text.upper() == "SKIP":
        return None
    return text


def _extractive_simplify(quick_scoop: str) -> str | None:
    """Falls back to the single shortest real sentence in the quick scoop,
    on the theory that the shortest sentence is usually the plainest one.
    Only used if it's meaningfully shorter than the whole scoop -- otherwise
    there's nothing to gain by duplicating it as a "simpler" version."""
    # Deliberately no minimum-length filter here, unlike the pipeline's main
    # sentence splitter: the whole point is to find the SHORTEST usable
    # sentence, so filtering out short ones would defeat the purpose.
    sentences = [s.strip() for s in SENTENCE_SPLIT_RE.split(quick_scoop) if len(s.strip().split()) >= 3]
    if len(sentences) < 2:
        return None
    shortest = min(sentences, key=lambda s: len(s.split()))
    if len(shortest.split()) >= len(quick_scoop.split()) * 0.7:
        return None
    return shortest


def add_simpler_explanations(stories: list[dict]) -> None:
    for story in stories:
        scoop = story.get("quickScoop")
        if not scoop:
            continue
        simpler = _gemini_simplify(scoop) or _extractive_simplify(scoop)
        if simpler:
            story["simplerExplanation"] = simpler
