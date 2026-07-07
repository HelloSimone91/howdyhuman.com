import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class HomepageI18nTest(unittest.TestCase):
    def test_category_heading_has_readable_fallback_and_fresh_assets(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")

        heading = re.search(
            r'<h2[^>]+data-i18n="categories\.indexHeading"[^>]*>([^<]+)</h2>',
            html,
        )
        self.assertIsNotNone(heading)
        self.assertEqual(heading.group(1), "Browse by category")
        asset_version = "texas-editorial-20260707"
        self.assertIn(f'href="style.css?v={asset_version}"', html)
        self.assertIn(f'src="script.js?v={asset_version}"', html)


if __name__ == "__main__":
    unittest.main()
