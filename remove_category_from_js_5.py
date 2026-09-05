import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = re.sub(r'\s+// Count values in this category\n', '\n', js)
js = re.sub(r'\s+countSpan\.textContent = `\(\$\{categoryCounts\[category\] \|\| 0\}\)`;\n', '\n', js)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
