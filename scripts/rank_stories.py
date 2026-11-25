"""Ranks normalized, deduplicated stories and selects a generous candidate
pool for the daily digest, favoring recency, source credibility, and
impact, while diversifying across categories rather than letting one topic
dominate. The pool is larger than the 5 stories actually shown so that
summarization rejections (insufficient source material) don't leave gaps,
and so there's a real pool left over for "Give Me 5 More" -- generate_digest.py
splits the successfully-summarized results into the primary 5 and up to 5
more, in ranked order.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

CANDIDATE_POOL_SIZE = 15

IMPACT_KEYWORDS = [
    "launch", "unveil", "announc", "breakthrough", "billion", "million", "funding",
    "raises", "acquir", "lawsuit", "ban", "regulat", "warns", "safety", "record",
    "first", "new model", "update", "partnership",
]


def recency_score(published_iso: str) -> float:
    try:
        published = datetime.fromisoformat(published_iso)
    except ValueError:
        return 0.0
    if published.tzinfo is None:
        published = published.replace(tzinfo=timezone.utc)
    age_hours = max(0.0, (datetime.now(timezone.utc) - published).total_seconds() / 3600)
    # Decays smoothly over 48h; recent news scores close to 1.0.
    return max(0.0, 1 - age_hours / 48)


def impact_score(text: str) -> float:
    lower = text.lower()
    hits = sum(1 for kw in IMPACT_KEYWORDS if kw in lower)
    return min(1.0, hits / 4)


def score_article(article: dict) -> float:
    text = f"{article['headline']} {article['raw_text']}"
    recency = recency_score(article["published_iso"])
    credibility = article["source_weight"]
    impact = impact_score(text)
    corroboration = min(1.0, (article.get("duplicate_source_count", 1) - 1) / 3)  # multiple outlets covering it signals significance
    detail = min(1.0, len(article["raw_text"].split()) / 60)  # enough supporting detail to summarize well
    return 0.30 * recency + 0.25 * credibility + 0.2 * impact + 0.15 * corroboration + 0.10 * detail


def select_diverse_top(articles: list[dict], limit: int) -> list[dict]:
    scored = sorted(articles, key=score_article, reverse=True)
    selected: list[dict] = []
    used_categories: set[str] = set()

    for article in scored:
        if len(selected) >= limit:
            break
        if article["category"] not in used_categories:
            selected.append(article)
            used_categories.add(article["category"])

    # Fill remaining slots from the rest of the ranked list, including repeats of a category if needed.
    for article in scored:
        if len(selected) >= limit:
            break
        if article not in selected:
            selected.append(article)

    return selected[:limit]


def main():
    with open("normalized_articles.json", "r", encoding="utf-8") as f:
        articles = json.load(f)

    for article in articles:
        article["_score"] = round(score_article(article), 4)

    selected = select_diverse_top(articles, CANDIDATE_POOL_SIZE)
    selected.sort(key=lambda a: a["_score"], reverse=True)

    print(f"Selected {len(selected)} of {len(articles)} candidates:")
    for a in selected:
        print(f"  [{a['_score']:.3f}] ({a['category']}) {a['headline'][:80]}")

    with open("ranked_stories.json", "w", encoding="utf-8") as f:
        json.dump(selected, f, indent=2)
    print("Wrote ranked_stories.json")


if __name__ == "__main__":
    main()
