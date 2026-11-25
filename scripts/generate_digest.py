"""Orchestrates the full daily pipeline: fetch -> normalize -> rank ->
summarize -> assemble DailyDigest JSON -> write latest.json, a dated
archive file, and the archive index.

Designed to fail safely: if fetching or summarizing comes up short, the
last successful digest is left in place (status becomes "stale" or
"partial") rather than being overwritten with empty or fabricated content.
"""
from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path

import fetch_news
import normalize_news
import rank_stories
import summarize_news
from glossary_discovery import discover_and_update_glossary
from common import ARCHIVE_DIR, DATA_DIR, EDITORIAL_TZ, editorial_today_str, load_glossary, now_iso

PRIMARY_STORY_COUNT = 5
MORE_STORY_COUNT = 5

LATEST_PATH = DATA_DIR / "latest.json"
ARCHIVE_INDEX_PATH = DATA_DIR / "archive-index.json"


def read_json(path: Path, fallback):
    if not path.exists():
        return fallback
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return fallback


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def term_of_the_day_candidates(stories: list[dict]) -> list[str]:
    seen = []
    for story in stories:
        for term_id in story.get("keyTerms", []):
            if term_id not in seen:
                seen.append(term_id)
    return seen


def run_pipeline() -> list[dict]:
    articles = fetch_news.fetch_all()
    write_json(Path("raw_articles.json"), [a.__dict__ for a in articles])

    normalize_news.main()
    rank_stories.main()
    summarize_news.main()

    with open("summarized_stories.json", "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    today = editorial_today_str()
    previous_digest = read_json(LATEST_PATH, None)

    try:
        stories = run_pipeline()
    except Exception:
        print("Pipeline failed with an exception:", file=sys.stderr)
        traceback.print_exc()
        stories = []

    if not stories:
        if previous_digest:
            print("No new stories produced; keeping the previous digest and marking it stale.")
            previous_digest["status"] = "stale"
            write_json(LATEST_PATH, previous_digest)
        else:
            print("No stories and no previous digest; writing an empty, honestly-labeled digest.")
            write_json(
                LATEST_PATH,
                {
                    "digestDate": today,
                    "editorialTimezone": "America/New_York",
                    "generatedAt": now_iso(),
                    "lastSuccessfulUpdate": now_iso(),
                    "status": "partial",
                    "stories": [],
                    "moreStories": [],
                    "termOfTheDayCandidateIds": [],
                },
            )
        return

    try:
        stories = discover_and_update_glossary(stories)
    except Exception:
        print("Glossary discovery failed (non-fatal, digest still publishes):", file=sys.stderr)
        traceback.print_exc()

    primary = stories[:PRIMARY_STORY_COUNT]
    more = stories[PRIMARY_STORY_COUNT : PRIMARY_STORY_COUNT + MORE_STORY_COUNT]

    status = "ok" if len(primary) >= PRIMARY_STORY_COUNT else "partial"
    digest = {
        "digestDate": today,
        "editorialTimezone": "America/New_York",
        "generatedAt": now_iso(),
        "lastSuccessfulUpdate": now_iso(),
        "status": status,
        "stories": primary,
        "moreStories": more,
        "termOfTheDayCandidateIds": term_of_the_day_candidates(primary + more),
    }

    write_json(LATEST_PATH, digest)
    write_json(ARCHIVE_DIR / f"{today}.json", digest)

    index = read_json(ARCHIVE_INDEX_PATH, [])
    index = [e for e in index if e["digestDate"] != today]
    index.append({"digestDate": today, "storyCount": len(primary)})
    index.sort(key=lambda e: e["digestDate"], reverse=True)
    write_json(ARCHIVE_INDEX_PATH, index)

    print(f"\nDigest for {today}: {len(primary)} stories (+{len(more)} more available), status={status}")
    print(f"Wrote {LATEST_PATH}, archive/{today}.json, and archive-index.json")


if __name__ == "__main__":
    main()
