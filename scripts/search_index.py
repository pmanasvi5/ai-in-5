"""Builds a compact, flat search index over every archived digest, so the
frontend can search the whole archive without loading each day's full
digest file upfront. Deliberately minimal per entry -- just enough to
search and link back to the full story.
"""
from __future__ import annotations

import json

from common import ARCHIVE_DIR, DATA_DIR

SEARCH_INDEX_PATH = DATA_DIR / "search-index.json"


def build_search_index() -> list[dict]:
    entries = []
    if not ARCHIVE_DIR.exists():
        return entries

    for path in sorted(ARCHIVE_DIR.glob("*.json")):
        digest_date = path.stem
        try:
            digest = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue

        for story in digest.get("stories", []) + digest.get("moreStories", []):
            entries.append(
                {
                    "id": story["id"],
                    "digestDate": digest_date,
                    "headline": story["headline"],
                    "source": story["source"],
                    "category": story["category"],
                    "keyTerms": story.get("keyTerms", []),
                    "url": story["originalUrl"],
                }
            )

    return entries


def write_search_index() -> int:
    entries = build_search_index()
    SEARCH_INDEX_PATH.write_text(json.dumps(entries, indent=2), encoding="utf-8")
    return len(entries)


if __name__ == "__main__":
    count = write_search_index()
    print(f"Wrote {count} entries to {SEARCH_INDEX_PATH}")
