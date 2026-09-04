import unittest
import json

from generate_seo_pages import render_json_ld

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

if __name__ == '__main__':
    unittest.main()
