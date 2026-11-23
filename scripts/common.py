"""Shared helpers for the AI in 5 news pipeline."""
from __future__ import annotations

import html
import json
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
ARCHIVE_DIR = DATA_DIR / "archive"
GLOSSARY_PATH = DATA_DIR / "glossary.json"

EDITORIAL_TZ = ZoneInfo("America/New_York")

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36 AIin5Bot/1.0 (+https://github.com/)"
)

# Each source: name shown to users, feed URL, and a trust weight used in ranking.
# Official company/research blogs are weighted highest since they're primary sources.
SOURCES = [
    {"name": "OpenAI", "url": "https://openai.com/news/rss.xml", "weight": 1.0, "kind": "official"},
    {"name": "Google DeepMind", "url": "https://deepmind.google/blog/rss.xml", "weight": 1.0, "kind": "official"},
    {"name": "Google AI Blog", "url": "https://blog.google/innovation-and-ai/technology/ai/rss/", "weight": 1.0, "kind": "official"},
    {"name": "The Verge", "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "weight": 0.85, "kind": "press"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "weight": 0.85, "kind": "press"},
    {"name": "MIT Technology Review", "url": "https://www.technologyreview.com/feed/", "weight": 0.9, "kind": "press", "requires_ai_keyword": True},
    {"name": "WIRED", "url": "https://www.wired.com/feed/tag/ai/latest/rss", "weight": 0.8, "kind": "press"},
]

CATEGORY_KEYWORDS = {
    "New Models": ["model", "release", "launch", "unveil", "introduc", "gpt", "gemini", "claude", "llama"],
    "Policy & Regulation": ["regulat", "law", "legislat", "congress", "senate", "policy", "ban", "lawsuit", "antitrust", "eu ai act"],
    "Safety & Security": ["safety", "risk", "security", "vulnerab", "misuse", "jailbreak", "deepfake", "harm"],
    "Research": ["research", "paper", "study", "breakthrough", "benchmark", "scientist"],
    "Health & Education": ["health", "medical", "hospital", "diagnos", "school", "student", "education", "university", "classroom"],
    "Business & Work": ["job", "layoff", "workforce", "hiring", "enterprise", "revenue", "funding", "valuation", "ipo", "earnings", "workplace"],
    "Company News": ["acquir", "acquisition", "partnership", "ceo", "executive", "hires", "raises", "announc"],
    "Tools & Apps": ["app", "tool", "feature", "assistant", "plugin", "extension", "update rolls out", "available now"],
}

# Glossary term -> list of surface forms to match against story text when
# tagging keyTerms for the frontend's contextual-definition popovers.
def load_glossary() -> list[dict]:
    with open(GLOSSARY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def strip_html(raw: str) -> str:
    if not raw:
        return ""
    text = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(text)
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def slugify(text: str, max_len: int = 60) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:max_len].rstrip("-")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def editorial_today_str(now: datetime | None = None) -> str:
    now = now or datetime.now(EDITORIAL_TZ)
    return now.astimezone(EDITORIAL_TZ).strftime("%Y-%m-%d")


def categorize(text: str) -> str:
    lower = text.lower()
    best_category = "Tools & Apps"
    best_score = 0
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score > best_score:
            best_score = score
            best_category = category
    return best_category


def tag_key_terms(text: str, glossary: list[dict]) -> list[str]:
    lower = text.lower()
    matches = []
    for entry in glossary:
        term_lower = entry["term"].lower()
        # Word/hyphen boundaries on both sides, so a compound like
        # "cutting-edge AI" can't falsely match the term "Edge AI".
        pattern = r"(?<![\w-])" + re.escape(term_lower) + r"(?![\w-])"
        if re.search(pattern, lower):
            matches.append(entry["id"])
    return matches


def estimate_reading_minutes(bullets: list[str], why_it_matters: str) -> int:
    words = sum(len(b.split()) for b in bullets) + len(why_it_matters.split())
    return max(1, round(words / 200 * 5))  # ~200 wpm, biased toward a quick skim time


@dataclass
class RawArticle:
    source: str
    source_weight: float
    headline: str
    link: str
    published_iso: str
    fetched_iso: str
    raw_text: str  # cleaned description/summary/content from the feed, used for grounding
    category: str = ""
    key_terms: list[str] = field(default_factory=list)
