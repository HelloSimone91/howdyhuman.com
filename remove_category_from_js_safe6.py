import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. remaining strings
js = re.sub(r'\s+indexHeading: \'Browse by category\'\n', '\n', js)

# 2. leftover category badge class names
js = re.sub(r'\s+badge\.className = \'text-sm opacity-75 category-badge\';\n\s+badge\.textContent = getCategoryLabel\(value\.category\);\n', '\n', js)

# 3. populate category filters block
js = re.sub(r'\s+// Populate category filters\n\s+if \(categoryFilters\) \{.*?\}\n\n        // Setup tag filters', '\n\n        // Setup tag filters', js, flags=re.DOTALL)


with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
