import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VALUES_DATA = json.loads((ROOT / "Values-en.json").read_text(encoding="utf-8"))["values"]
ALL_VALUE_SLUGS = [
    re.sub(r"[^a-z0-9]+", "-", value["name"].lower()).strip("-")
    for value in VALUES_DATA
]
PILOT_SLUGS = [
    "courage",
    "integrity",
    "compassion",
    "clarity",
    "self-awareness",
]
REPLACEMENT_EXAMPLE_SLUGS = {
    "action",
    "ambiguity",
    "capitalism",
    "charisma",
    "effectiveness",
    "fine-art",
    "impact",
    "luxury",
    "mission",
    "money",
    "piety",
    "professionalism",
    "representation",
    "sovereignty",
    "sports",
    "synergy",
    "technology",
}


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in {"script", "style"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data):
        if not self._skip_depth:
            self.parts.append(data)

    @property
    def text(self):
        return " ".join(part.strip() for part in self.parts if part.strip())


def visible_text(html):
    parser = TextExtractor()
    parser.feed(html)
    return parser.text


def json_ld_graph(html):
    match = re.search(
        r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
        html,
        re.DOTALL,
    )
    if not match:
        return []
    data = json.loads(match.group(1))
    return data.get("@graph", [data])


def section_text(text, heading, next_heading=None):
    start = text.index(heading) + len(heading)
    if next_heading and next_heading in text[start:]:
        end = text.index(next_heading, start)
        return text[start:end].strip()
    return text[start:].strip()


def value_by_slug(slug):
    return next(
        value for value in VALUES_DATA
        if re.sub(r"[^a-z0-9]+", "-", value["name"].lower()).strip("-") == slug
    )


def meaningful_terms(text):
    stopwords = {
        "a", "an", "and", "are", "as", "being", "by", "for", "in", "is", "it",
        "of", "or", "the", "their", "to", "when", "with", "your", "you",
    }
    return [
        word for word in re.findall(r"\b[a-zA-Z][a-zA-Z'-]{3,}\b", text)
        if word.lower() not in stopwords
    ]


class ExpandedValuePageTest(unittest.TestCase):
    def page_html(self, slug):
        return (ROOT / "values" / slug / "index.html").read_text(encoding="utf-8")

    def test_all_value_pages_use_expanded_template(self):
        required_headings = [
            "Why this matters",
            "Examples in action",
            "How to practice",
            "Associated verbs",
            "Related values",
            "Frequently asked questions",
        ]

        for slug in ALL_VALUE_SLUGS:
            with self.subTest(slug=slug):
                html = self.page_html(slug)
                text = visible_text(html)
                for heading in required_headings:
                    self.assertIn(heading, text)
                self.assertGreaterEqual(
                    len(re.findall(r"\b[\w'-]+\b", text)),
                    350,
                    f"{slug} should have expanded, indexable copy",
                )
                self.assertGreaterEqual(html.count("<li>"), 7)
                self.assertIn('class="chip" href="/verbs/', html)
                self.assertIn('href="/values/', html)

    def test_all_value_pages_include_three_faqs_with_schema(self):
        for slug in ALL_VALUE_SLUGS:
            with self.subTest(slug=slug):
                html = self.page_html(slug)
                graph = json_ld_graph(html)
                faq = next((item for item in graph if item.get("@type") == "FAQPage"), None)
                self.assertIsNotNone(faq)
                questions = faq.get("mainEntity", [])
                self.assertEqual(len(questions), 3)
                for question in questions:
                    self.assertEqual(question.get("@type"), "Question")
                    self.assertIn("name", question)
                    answer = question.get("acceptedAnswer", {})
                    self.assertEqual(answer.get("@type"), "Answer")
                    self.assertGreater(len(answer.get("text", "")), 60)

    def test_pilot_pages_keep_custom_editorial_language(self):
        expected_phrases = {
            "courage": "values become real at the point where comfort runs out",
            "integrity": "Without integrity, values become branding",
            "compassion": "What would help without making this person smaller?",
            "clarity": "confusion quietly burns energy",
            "self-awareness": "Understanding your own thoughts, feelings, and actions is not self-obsession",
        }

        for slug, phrase in expected_phrases.items():
            with self.subTest(slug=slug):
                self.assertIn(phrase, visible_text(self.page_html(slug)))

    def test_expanded_copy_is_value_specific_and_not_repeated_boilerplate(self):
        why_sections = {}
        faq_answers = []
        first_sentences = []

        for slug in ALL_VALUE_SLUGS:
            with self.subTest(slug=slug):
                value = value_by_slug(slug)
                html = self.page_html(slug)
                text = visible_text(html)
                why = section_text(text, "Why this matters", "Examples in action")
                examples = section_text(text, "Examples in action", "How to practice")
                practice = section_text(text, "How to practice", "Associated verbs")
                graph = json_ld_graph(html)
                faq = next(item for item in graph if item.get("@type") == "FAQPage")

                why_sections[slug] = why
                first_sentence = why.split(".")[0].strip()
                first_sentences.append(first_sentence)

                self.assertIn(value["name"], text)
                source_terms = meaningful_terms(value["description"])
                self.assertTrue(
                    any(term.lower() in why.lower() for term in source_terms),
                    f"{slug} should pull meaningful language from its own definition into the why section",
                )
                if slug not in REPLACEMENT_EXAMPLE_SLUGS:
                    self.assertIn(value["example"].split()[0], examples)
                else:
                    self.assertNotIn(value["example"], examples)
                self.assertTrue(
                    any(tag.lower() in practice.lower() or tag.lower() in why.lower() for tag in value.get("tags", [])[:3]),
                    f"{slug} should use its own associated verbs in the expanded writing",
                )

                for question in faq["mainEntity"]:
                    faq_answers.append(question["acceptedAnswer"]["text"])

        duplicated_why = [
            section for section in why_sections.values()
            if list(why_sections.values()).count(section) > 1
        ]
        self.assertFalse(duplicated_why, "No two value pages should share the same why-this-matters copy")
        self.assertEqual(len(faq_answers), len(set(faq_answers)), "FAQ answers should not repeat across value pages")
        self.assertGreater(
            len(set(first_sentences)),
            120,
            "Most value pages should open their why-this-matters section differently",
        )


if __name__ == "__main__":
    unittest.main()
