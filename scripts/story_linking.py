"""Conservatively links a new story to earlier coverage of the same
ongoing development ("Previously on AI...") by matching named entities
(companies, products, people) plus category and headline similarity.

Deliberately read-only against the archive: it only looks backward and
never rewrites a previously published digest file, so published records
stay stable and trustworthy. A story with no confident match simply gets
no "previousMentions" field at all -- the frontend treats that as "nothing
to show" rather than an empty, misleading section.
"""
from __future__ import annotations

import json
import re
from difflib import SequenceMatcher

from common import ARCHIVE_DIR, slugify

MAX_LOOKBACK_DAYS = 30
MAX_PREVIOUS_MENTIONS = 3
MIN_HEADLINE_SIMILARITY = 0.3  # related-but-distinct, well below the ~0.72 true-duplicate threshold
MAX_HEADLINE_SIMILARITY = 0.72  # at/above this it's a duplicate of the SAME article, not a follow-up

# Multi-word proper-noun sequences, e.g. "Jensen Huang", "Google DeepMind".
MULTIWORD_ENTITY_RE = re.compile(r"\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){1,3})\b")

# Well-known single-word AI companies/products worth matching on their own,
# since many wouldn't otherwise form a multi-word capitalized sequence.
KNOWN_SINGLE_WORD_ENTITIES = {
    "openai", "anthropic", "nvidia", "microsoft", "google", "meta", "amazon",
    "apple", "deepmind", "tesla", "xai", "mistral", "perplexity", "midjourney",
    "chatgpt", "gemini", "claude", "copilot", "gpt", "llama", "grok", "tidal",
}

STOPWORD_STARTS = {"The", "This", "That", "These", "Those", "A", "An", "It", "Its", "There"}


def extract_entities(text: str) -> set[str]:
    entities = set()
    for match in MULTIWORD_ENTITY_RE.finditer(text):
        phrase = match.group(1)
        first_word = phrase.split()[0]
        if first_word in STOPWORD_STARTS:
            continue
        entities.add(phrase.lower())

    lower = text.lower()
    for word in KNOWN_SINGLE_WORD_ENTITIES:
        if re.search(rf"(?<![\w-]){re.escape(word)}(?![\w-])", lower):
            entities.add(word)

    return entities


def _story_text(story: dict) -> str:
    parts = [story.get("headline", ""), story.get("quickScoop", "") or ""]
    return " ".join(parts)


def _headline_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _load_recent_archive(today: str, exclude_today: bool = True) -> list[tuple[str, dict]]:
    """Returns (digestDate, story) pairs from archive files within the
    lookback window, oldest excluded if they fall outside it, today's own
    file excluded by default (we're linking against the PAST)."""
    results = []
    if not ARCHIVE_DIR.exists():
        return results
    for path in sorted(ARCHIVE_DIR.glob("*.json"), reverse=True)[: MAX_LOOKBACK_DAYS + 1]:
        date_str = path.stem
        if exclude_today and date_str == today:
            continue
        try:
            digest = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        for story in digest.get("stories", []) + digest.get("moreStories", []):
            results.append((date_str, story))
    return results


def find_previous_mentions(story: dict, today: str) -> list[dict]:
    story_entities = extract_entities(_story_text(story))
    if not story_entities:
        return []

    candidates = []
    for date_str, past_story in _load_recent_archive(today):
        if past_story.get("category") != story.get("category"):
            continue
        past_entities = extract_entities(_story_text(past_story))
        shared = story_entities & past_entities
        if not shared:
            continue

        similarity = _headline_similarity(story["headline"], past_story["headline"])
        if similarity >= MAX_HEADLINE_SIMILARITY:
            continue  # same article re-surfacing, not a genuine follow-up

        # Require either a strong multi-word entity match, or at least two
        # shared signals (e.g. two single-word entities), to stay conservative.
        strong_match = any(" " in e for e in shared) or len(shared) >= 2
        if not strong_match:
            continue

        candidates.append(
            {
                "date": date_str,
                "headline": past_story["headline"],
                "url": past_story["originalUrl"],
                "_shared_entities": len(shared),
                "_similarity": similarity,
            }
        )

    candidates.sort(key=lambda c: (c["_shared_entities"], c["date"]), reverse=True)
    deduped = []
    seen_headlines = set()
    for c in candidates:
        if c["headline"] in seen_headlines:
            continue
        seen_headlines.add(c["headline"])
        deduped.append({"date": c["date"], "headline": c["headline"], "url": c["url"]})
        if len(deduped) >= MAX_PREVIOUS_MENTIONS:
            break
    return deduped


def follow_up_label(mentions: list[dict], story: dict) -> str:
    if not mentions:
        return ""
    text = _story_text(story).lower()
    if any(kw in text for kw in ("announc", "unveil", "launch", "debut")):
        return "Major Announcement"
    if len(mentions) >= 2:
        return "Story Update"
    return "New Development"


def link_stories(stories: list[dict], today: str) -> list[dict]:
    for story in stories:
        mentions = find_previous_mentions(story, today)
        if mentions:
            story["previousMentions"] = mentions
            story["followUpLabel"] = follow_up_label(mentions, story)
            story["threadId"] = slugify(mentions[-1]["headline"])  # anchor to the earliest known mention
    return stories
