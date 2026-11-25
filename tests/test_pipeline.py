"""Tests for the news pipeline's non-generative logic: HTML cleaning, key-term
tagging precision, deduplication, and the extractive summarizer's refusal to
fabricate bullets when there isn't enough real source text.

Run with: python3 -m pytest tests/test_pipeline.py -v
(or python3 tests/test_pipeline.py to run without pytest)
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from common import strip_html, tag_key_terms, categorize, starts_with_banned_opening  # noqa: E402
from normalize_news import deduplicate, headline_similarity  # noqa: E402
from summarize_news import extractive_summarize, split_sentences, trim_to_word_budget  # noqa: E402

GLOSSARY = [
    {"id": "edge-ai", "term": "Edge AI", "definition": "", "everydayExample": "", "whyItMatters": "", "relatedTerms": []},
    {"id": "ai-agent", "term": "AI Agent", "definition": "", "everydayExample": "", "whyItMatters": "", "relatedTerms": []},
]


class TestStripHtml(unittest.TestCase):
    def test_decodes_html_entities(self):
        self.assertEqual(strip_html("Anthropic&#8217;s model"), "Anthropic’s model")

    def test_removes_tags(self):
        self.assertEqual(strip_html("<p>Hello <b>world</b></p>"), "Hello world")


class TestTagKeyTerms(unittest.TestCase):
    def test_matches_whole_term(self):
        self.assertIn("ai-agent", tag_key_terms("This new AI Agent can browse the web.", GLOSSARY))

    def test_does_not_false_match_compound_words(self):
        # "cutting-edge AI" should NOT match the glossary term "Edge AI".
        matches = tag_key_terms("Nvidia's cutting-edge AI hardware is in demand.", GLOSSARY)
        self.assertNotIn("edge-ai", matches)

    def test_matches_real_edge_ai_mention(self):
        matches = tag_key_terms("The new chip enables Edge AI on small devices.", GLOSSARY)
        self.assertIn("edge-ai", matches)


class TestCategorize(unittest.TestCase):
    def test_regulation_keywords_win(self):
        self.assertEqual(categorize("EU lawmakers advance new AI regulation bill"), "Policy & Regulation")


class TestDeduplicate(unittest.TestCase):
    def test_near_identical_headlines_are_merged(self):
        articles = [
            {"headline": "OpenAI launches GPT-6 today", "source_weight": 0.85, "published_iso": "2026-01-01T00:00:00+00:00"},
            {"headline": "OpenAI Launches GPT-6 Today", "source_weight": 1.0, "published_iso": "2026-01-01T01:00:00+00:00"},
            {"headline": "Totally unrelated story about chips", "source_weight": 0.8, "published_iso": "2026-01-01T00:00:00+00:00"},
        ]
        result = deduplicate(articles)
        self.assertEqual(len(result), 2)
        kept = [a for a in result if "GPT-6" in a["headline"]][0]
        self.assertEqual(kept["source_weight"], 1.0)  # kept the higher-credibility source
        self.assertEqual(kept["duplicate_source_count"], 2)

    def test_similarity_is_high_for_near_duplicates(self):
        self.assertGreater(
            headline_similarity("OpenAI launches GPT-6 today", "OpenAI Launches GPT-6 Today"), 0.9
        )


class TestExtractiveSummarizer(unittest.TestCase):
    def test_rejects_story_with_too_little_source_text(self):
        article = {
            "headline": "Short news item",
            "raw_text": "Brief update. Nothing more to say here really.",
            "source": "Test Source",
            "category": "Tools & Apps",
        }
        self.assertIsNone(extractive_summarize(article))

    def test_accepts_story_with_enough_source_text(self):
        article = {
            "headline": "A new AI tool was released today",
            "raw_text": (
                "The company announced a new AI tool for developers this week. "
                "It integrates with existing workflows and is available immediately to all users. "
                "Early users report significant time savings on repetitive tasks they used to do by hand. "
                "The tool also supports a plugin system for custom extensions built by the community."
            ),
            "source": "Test Source",
            "category": "Tools & Apps",
        }
        result = extractive_summarize(article)
        self.assertIsNotNone(result)
        self.assertTrue(result["quickScoop"])
        self.assertGreaterEqual(len(result["takeaways"]), 2)
        self.assertLessEqual(len(result["takeaways"]), 5)
        self.assertTrue(result["whyItMatters"])

    def test_filters_newsletter_boilerplate(self):
        text = "This is today's edition of our newsletter. Sign up here for more. A real fact about the AI model's release date was announced."
        sentences = split_sentences(text)
        self.assertTrue(all("sign up" not in s.lower() for s in sentences))
        self.assertTrue(all("today's edition" not in s.lower() for s in sentences))

    def test_trims_long_text_to_word_budget_with_ellipsis(self):
        long_text = " ".join(f"word{i}" for i in range(50))
        trimmed = trim_to_word_budget(long_text, 16)
        self.assertEqual(len(trimmed.split()), 16)  # ellipsis is attached to the last word, not a separate token
        self.assertTrue(trimmed.endswith("…"))

    def test_leaves_short_text_unchanged(self):
        short_text = "This is short enough."
        self.assertEqual(trim_to_word_budget(short_text, 16), short_text)


class TestBannedOpenings(unittest.TestCase):
    def test_flags_cliche_opening(self):
        self.assertTrue(starts_with_banned_opening("In today's rapidly evolving AI landscape, a new model emerged."))

    def test_allows_normal_opening(self):
        self.assertFalse(starts_with_banned_opening("OpenAI released a new model on Tuesday that can browse the web."))


class TestGlossaryDiscovery(unittest.TestCase):
    def test_promotes_mentioned_seed_term(self):
        from glossary_discovery import promote_from_seed_pool

        glossary = [{"id": "ai-agent", "term": "AI Agent", "definition": "", "everydayExample": "", "whyItMatters": "", "relatedTerms": []}]
        seed_pool = [
            {"id": "gpu", "term": "GPU", "definition": "d", "everydayExample": "e", "whyItMatters": "w", "relatedTerms": []},
            {"id": "mixture-of-experts", "term": "Mixture of Experts", "definition": "d", "everydayExample": "e", "whyItMatters": "w", "relatedTerms": []},
        ]
        stories = [{"headline": "New chip uses more GPU power than ever", "quickScoop": "", "whyItMatters": "", "summary": []}]

        promoted = promote_from_seed_pool(stories, glossary, seed_pool)

        self.assertEqual([t["id"] for t in promoted], ["gpu"])
        self.assertIn("gpu", {t["id"] for t in glossary})
        self.assertEqual([t["id"] for t in seed_pool], ["mixture-of-experts"])  # only the unmentioned term remains

    def test_does_not_promote_unmentioned_terms(self):
        from glossary_discovery import promote_from_seed_pool

        glossary = []
        seed_pool = [{"id": "gpu", "term": "GPU", "definition": "d", "everydayExample": "e", "whyItMatters": "w", "relatedTerms": []}]
        stories = [{"headline": "A story about something unrelated", "quickScoop": "", "whyItMatters": "", "summary": []}]

        promoted = promote_from_seed_pool(stories, glossary, seed_pool)

        self.assertEqual(promoted, [])
        self.assertEqual(glossary, [])
        self.assertEqual(len(seed_pool), 1)


if __name__ == "__main__":
    unittest.main()
