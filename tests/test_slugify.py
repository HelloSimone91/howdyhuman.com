import unittest
import sys
import os

# Add the root directory to the python path so we can import generate_seo_pages
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from generate_seo_pages import slugify

class TestSlugify(unittest.TestCase):
    def test_happy_path(self):
        self.assertEqual(slugify("helloworld"), "helloworld")
        self.assertEqual(slugify("hello-world"), "hello-world")

    def test_lowercase(self):
        self.assertEqual(slugify("HelloWorld"), "helloworld")

    def test_spaces_and_special_chars(self):
        self.assertEqual(slugify("Hello World!"), "hello-world")
        self.assertEqual(slugify("This is a test @#$%"), "this-is-a-test")

    def test_accents_and_unicode(self):
        self.assertEqual(slugify("café"), "cafe")
        self.assertEqual(slugify("naïve"), "naive")
        self.assertEqual(slugify("München"), "munchen")

    def test_strip_dashes(self):
        self.assertEqual(slugify("---hello---world---"), "hello-world")
        self.assertEqual(slugify("   hello   world   "), "hello-world")

    def test_fallback_to_item(self):
        self.assertEqual(slugify(""), "item")
        self.assertEqual(slugify("!@#$%^"), "item")
        self.assertEqual(slugify("---"), "item")

if __name__ == "__main__":
    unittest.main()
