import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Variables referencing category to clean up:
# initialization
js = re.sub(r'\s+categoryFilters = document\.getElementById\(\'categoryFilters\'\);\n', '\n', js)
js = re.sub(r'\s+categoryFilterSearch = document\.getElementById\(\'categoryFilterSearch\'\);\n', '\n', js)

# clearing category filters block
js = re.sub(r'\s+if \(categoryFilters\) categoryFilters\.innerHTML = \'\';\n', '\n', js)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
