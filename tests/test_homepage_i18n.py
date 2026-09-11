import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class HomepageI18nTest(unittest.TestCase):


    def test_active_verb_filter_banner_stays_visible_while_scrolling(self):
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        sticky_banner = re.search(r"\.verb-filter-header\s*\{([^}]+)\}", css)
        self.assertIsNotNone(sticky_banner)
        declarations = sticky_banner.group(1)
        self.assertIn("position: sticky", declarations)
        self.assertIn("top: var(--alpha-nav-sticky-offset, 0px)", declarations)

        script = (ROOT / "script.js").read_text(encoding="utf-8")
        self.assertIn("--alpha-nav-sticky-offset", script)
        self.assertIn("ResizeObserver", script)

    def test_each_palette_defines_the_value_color_hierarchy(self):
        css = (ROOT / "style.css").read_text(encoding="utf-8")
        script = (ROOT / "script.js").read_text(encoding="utf-8")

        palette_expectations = {
            "hill-country": (
                "--value-title-accent: var(--support-purple);",
                "--value-detail-accent: var(--accent-primary);",
                "--related-values-accent: var(--accent-secondary);",
            ),
            "electric-bloom": (
                "--value-title-accent: var(--accent-secondary);",
                "--value-detail-accent: var(--accent-secondary);",
                "--related-values-accent: var(--accent-primary);",
            ),
            "blue-hour": (
                "--value-title-accent: var(--accent-secondary);",
                "--value-detail-accent: var(--accent-primary);",
                "--related-values-accent: #e4cc52;",
            ),
            "night-garden": (
                "--value-title-accent: var(--accent-primary);",
                "--value-detail-accent: var(--accent-secondary);",
                "--related-values-accent: var(--accent-primary);",
            ),
        }

        for palette, declarations in palette_expectations.items():
            palette_block = re.search(
                rf'body\[data-palette="{palette}"\]\s*\{{([^}}]+)\}}', css
            )
            self.assertIsNotNone(palette_block, palette)
            for declaration in declarations:
                self.assertIn(declaration, palette_block.group(1), palette)

        self.assertIn("color: var(--value-title-accent);", css)
        self.assertIn("background: var(--value-detail-accent);", css)
        self.assertIn("border-left: 5px solid var(--value-detail-accent);", css)
        self.assertIn("border-left: 5px solid var(--related-values-accent);", css)
        self.assertIn("'section-label', 'section-label--related'", script)

    def test_palette_tag_states_use_solid_sky_and_readable_foregrounds(self):
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        palette_expectations = {
            "hill-country": (
                "--support-sky: #d8ddd5;",
                "--tag-hover-text: var(--header-text);",
            ),
            "electric-bloom": (
                "--support-sky: #9fd9e0;",
                "--tag-hover-text: var(--header-text);",
                "--tag-selected-text: var(--header-text);",
            ),
            "blue-hour": (
                "--support-sky: #bee0ff;",
                "--tag-hover-text: var(--background);",
                "--tag-selected-text: var(--background);",
            ),
            "night-garden": (
                "--support-sky: #7faab2;",
                "--tag-hover-text: #20182d;",
                "--tag-selected-text: #20182d;",
            ),
        }

        for palette, declarations in palette_expectations.items():
            palette_block = re.search(
                rf'body\[data-palette="{palette}"\]\s*\{{([^}}]+)\}}', css
            )
            self.assertIsNotNone(palette_block, palette)
            for declaration in declarations:
                self.assertIn(declaration, palette_block.group(1), palette)

        self.assertIn("color: var(--tag-hover-text);", css)
        self.assertIn("color: var(--tag-selected-text);", css)


if __name__ == "__main__":
    unittest.main()
