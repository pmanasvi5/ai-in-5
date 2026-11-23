"""Fetches raw AI news articles from publicly accessible RSS feeds.

Each source is fetched independently; a failure on one source (timeout,
HTTP error, malformed feed) is logged and skipped rather than failing the
whole pipeline. Never fabricates an article — every RawArticle here traces
back to a real feed entry with its real headline, link, and timestamp.
"""
from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone

import feedparser
import requests

from common import SOURCES, USER_AGENT, RawArticle, now_iso, strip_html

TIMEOUT_SECONDS = 15
RETRY_COUNT = 2


def fetch_feed_bytes(url: str) -> bytes | None:
    last_error = None
    for attempt in range(RETRY_COUNT + 1):
        try:
            resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT_SECONDS)
            if resp.status_code == 200:
                return resp.content
            last_error = f"HTTP {resp.status_code}"
        except requests.RequestException as exc:
            last_error = str(exc)
        if attempt < RETRY_COUNT:
            time.sleep(2 * (attempt + 1))
    print(f"  [skip] {url} -> {last_error}", file=sys.stderr)
    return None


def parse_published(entry) -> str | None:
    for key in ("published_parsed", "updated_parsed"):
        value = getattr(entry, key, None)
        if value:
            try:
                return datetime(*value[:6], tzinfo=timezone.utc).isoformat()
            except (TypeError, ValueError):
                continue
    return None


def entry_text(entry) -> str:
    if hasattr(entry, "content") and entry.content:
        return strip_html(entry.content[0].value)
    if hasattr(entry, "summary"):
        return strip_html(entry.summary)
    return ""


def fetch_all() -> list[RawArticle]:
    articles: list[RawArticle] = []
    for source in SOURCES:
        print(f"Fetching {source['name']}...")
        raw = fetch_feed_bytes(source["url"])
        if raw is None:
            continue
        parsed = feedparser.parse(raw)
        if parsed.bozo and not parsed.entries:
            print(f"  [skip] {source['name']} -> malformed feed", file=sys.stderr)
            continue
        count = 0
        for entry in parsed.entries:
            headline = strip_html(getattr(entry, "title", "") or "")
            link = getattr(entry, "link", "") or ""
            if not headline or not link:
                continue
            published = parse_published(entry) or now_iso()
            text = entry_text(entry)
            if source.get("requires_ai_keyword"):
                haystack = (headline + " " + text).lower()
                if "ai " not in haystack and "artificial intelligence" not in haystack and " ai." not in haystack and not haystack.startswith("ai "):
                    continue
            articles.append(
                RawArticle(
                    source=source["name"],
                    source_weight=source["weight"],
                    headline=headline,
                    link=link,
                    published_iso=published,
                    fetched_iso=now_iso(),
                    raw_text=text,
                )
            )
            count += 1
        print(f"  -> {count} articles")
    return articles


def main():
    articles = fetch_all()
    out_path = "raw_articles.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump([a.__dict__ for a in articles], f, indent=2)
    print(f"\nFetched {len(articles)} total articles -> {out_path}")


if __name__ == "__main__":
    main()
