import unittest
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class TestNormalizeInitialLetter(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()
        cls.page = cls.browser.new_page()

        file_path = f"file://{ROOT / 'index.html'}"
        cls.page.goto(file_path)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def run_normalize(self, name):
        # A more robust Playwright pattern to pass arguments to the page
        return self.page.evaluate("name => normalizeInitialLetter(name)", name)

    def test_normalize_empty_and_whitespace(self):
        # Empty and whitespace cases should return '#'
        self.assertEqual(self.run_normalize(None), "#")
        self.assertEqual(self.run_normalize(""), "#")
        self.assertEqual(self.run_normalize("   "), "#")
        self.assertEqual(self.run_normalize("\t\n"), "#")

    def test_normalize_basic_latin(self):
        # Basic letters should just capitalize
        self.assertEqual(self.run_normalize("Apple"), "A")
        self.assertEqual(self.run_normalize("apple"), "A")
        self.assertEqual(self.run_normalize(" banana "), "B")

    def test_normalize_initial_letter_map(self):
        # Letters specifically defined in initialLetterMap
        self.assertEqual(self.run_normalize("Álamo"), "A")
        self.assertEqual(self.run_normalize("Épico"), "E")
        self.assertEqual(self.run_normalize("Ñandu"), "Ñ")
        self.assertEqual(self.run_normalize("Øresund"), "O")

    def test_normalize_diacritic_fallback(self):
        # Diacritics not in map should be removed using NFD
        self.assertEqual(self.run_normalize("český"), "C")
        self.assertEqual(self.run_normalize("şarkı"), "S")

    def test_normalize_special_characters(self):
        # Special characters and numbers
        self.assertEqual(self.run_normalize("123"), "1")
        self.assertEqual(self.run_normalize("!hello"), "!")
        self.assertEqual(self.run_normalize("[]bracket"), "[")

if __name__ == '__main__':
    unittest.main()
