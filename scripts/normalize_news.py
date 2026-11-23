"""Normalizes raw fetched articles: filters to AI-relevant and fresh items,
deduplicates stories reported by multiple outlets, and tags category plus
glossary key terms.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher

from common import categorize, load_glossary, tag_key_terms

AI_KEYWORDS = [
    "ai", "artificial intelligence", "machine learning", "llm", "chatbot", "genai",
    "generative ai", "neural network", "openai", "deepmind", "gemini", "chatgpt",
    "claude", "anthropic", "nvidia", "copilot", "agent", "model",
]

FRESHNESS_WINDOW_HOURS = 48


def is_ai_relevant(headline: str, text: str) -> bool:
    haystack = f"{headline} {text}".lower()
    return any(re.search(rf"\b{re.escape(kw)}\b", haystack) for kw in AI_KEYWORDS)


def is_fresh(published_iso: str, window_hours: int = FRESHNESS_WINDOW_HOURS) -> bool:
    try:
        published = datetime.fromisoformat(published_iso)
    except ValueError:
        return False
    if published.tzinfo is None:
        published = published.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - published
    return timedelta(0) <= age <= timedelta(hours=window_hours) or age < timedelta(0)  # allow slight clock skew


def normalize_headline(headline: str) -> str:
    text = headline.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def headline_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_headline(a), normalize_headline(b)).ratio()


def deduplicate(articles: list[dict]) -> list[dict]:
    """Groups articles that appear to cover the same event (near-identical
    headlines) and keeps the one from the highest-weighted source, breaking
    ties by earliest publish time."""
    clusters: list[list[dict]] = []
    for article in articles:
        placed = False
        for cluster in clusters:
            if headline_similarity(article["headline"], cluster[0]["headline"]) >= 0.72:
                cluster.append(article)
                placed = True
                break
        if not placed:
            clusters.append([article])

    deduped = []
    for cluster in clusters:
        best = max(cluster, key=lambda a: (a["source_weight"], -_parse_ts(a["published_iso"])))
        best["duplicate_source_count"] = len(cluster)
        deduped.append(best)
    return deduped


def _parse_ts(iso: str) -> float:
    try:
        return datetime.fromisoformat(iso).timestamp()
    except ValueError:
        return 0.0


def main():
    with open("raw_articles.json", "r", encoding="utf-8") as f:
        articles = json.load(f)

    glossary = load_glossary()

    relevant = [a for a in articles if is_ai_relevant(a["headline"], a["raw_text"])]
    fresh = [a for a in relevant if is_fresh(a["published_iso"])]

    print(f"Raw: {len(articles)}  AI-relevant: {len(relevant)}  Fresh (<= {FRESHNESS_WINDOW_HOURS}h): {len(fresh)}")

    pool = fresh if len(fresh) >= 5 else relevant
    if pool is relevant and len(fresh) < 5:
        print(f"  [note] Only {len(fresh)} fresh articles; widening pool to all {len(relevant)} AI-relevant articles.", file=sys.stderr)

    deduped = deduplicate(pool)
    print(f"After deduplication: {len(deduped)} distinct stories")

    for article in deduped:
        text = f"{article['headline']} {article['raw_text']}"
        article["category"] = categorize(text)
        article["key_terms"] = tag_key_terms(text, glossary)

    with open("normalized_articles.json", "w", encoding="utf-8") as f:
        json.dump(deduped, f, indent=2)
    print("Wrote normalized_articles.json")


if __name__ == "__main__":
    main()
