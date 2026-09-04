import sys
from pathlib import Path
import unittest
import json

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from generate_seo_pages import render_json_ld, breadcrumb_schema

class TestRenderJsonLd(unittest.TestCase):
    def test_basic_serialization(self):
        data = {"name": "Test", "value": 123}
        result = render_json_ld(data)
        self.assertEqual(json.loads(result), data)
        self.assertNotIn('<\\/', result)

    def test_tag_escaping(self):
        data = {"script": "</script>"}
        result = render_json_ld(data)
        # Should escape </ to <\/
        self.assertIn('<\\/script>', result)
        self.assertNotIn('</script>', result)

    def test_nested_dictionaries(self):
        data = {
            "outer": {
                "inner": "<div></form>"
            }
        }
        result = render_json_ld(data)
        self.assertIn('<\\/form>', result)
        self.assertNotIn('</form>', result)

class TestBreadcrumbSchema(unittest.TestCase):
    def test_breadcrumb_schema_empty(self):
        result = breadcrumb_schema([])
        expected = {
            '@type': 'BreadcrumbList',
            'itemListElement': []
        }
        self.assertEqual(result, expected)

    def test_breadcrumb_schema_single_item(self):
        items = [('Home', 'https://example.com/')]
        result = breadcrumb_schema(items)
        expected = {
            '@type': 'BreadcrumbList',
            'itemListElement': [
                {
                    '@type': 'ListItem',
                    'position': 1,
                    'name': 'Home',
                    'item': 'https://example.com/',
                }
            ]
        }
        self.assertEqual(result, expected)

    def test_breadcrumb_schema_multiple_items(self):
        items = [
            ('Home', 'https://example.com/'),
            ('Category', 'https://example.com/category/'),
            ('Item', 'https://example.com/category/item/'),
        ]
        result = breadcrumb_schema(items)
        expected = {
            '@type': 'BreadcrumbList',
            'itemListElement': [
                {
                    '@type': 'ListItem',
                    'position': 1,
                    'name': 'Home',
                    'item': 'https://example.com/',
                },
                {
                    '@type': 'ListItem',
                    'position': 2,
                    'name': 'Category',
                    'item': 'https://example.com/category/',
                },
                {
                    '@type': 'ListItem',
                    'position': 3,
                    'name': 'Item',
                    'item': 'https://example.com/category/item/',
                }
            ]
        }
        self.assertEqual(result, expected)

if __name__ == '__main__':
    unittest.main()
