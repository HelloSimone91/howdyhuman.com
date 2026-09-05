import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove specific localized string lines
js = re.sub(r'\s+indexHeading: \'Browse by category\'\n', '\n', js)
js = re.sub(r'\s+sortCategory: \'Category\',\n', '\n', js)
js = re.sub(r'\s+categorySearchPlaceholder: \'Search categories\',\n', '\n', js)
js = re.sub(r'\s+showingCategory: \'Showing values in category: \{\{category\}\}\',\n', '\n', js)
js = re.sub(r'\s+categoryCleared: \'Category filter cleared: \{\{category\}\}\',\n', '\n', js)

js = re.sub(r'\s+sortCategory: \'Categoría\',\n', '\n', js)
js = re.sub(r'\s+categorySearchPlaceholder: \'Buscar categorías\',\n', '\n', js)
js = re.sub(r'\s+showingCategory: \'Mostrando valores en la categoría: \{\{category\}\}\',\n', '\n', js)
js = re.sub(r'\s+categoryCleared: \'Filtro de categoría borrado: \{\{category\}\}\',\n', '\n', js)

# Remove categoryEmojiMap logic entirely since categories are gone
js = re.sub(r'\s+const categoryEmojiMap = \{.*?    \};\n', '\n', js, flags=re.DOTALL)
js = re.sub(r'    return matchingKeyword\?\.emoji \|\| categoryEmojiMap\[value\.category\] \|\| \'✨\';\n', '    return matchingKeyword?.emoji || \'✨\';\n', js)

# Remove the straggler lines
js = re.sub(r'\s+label\.htmlFor = `category-\$\{category\}`;.*?\n', '\n', js)
js = re.sub(r'\s+label\.textContent = getCategoryLabel\(category\);.*?\n', '\n', js)
js = re.sub(r'\s+// Count values in this category\n\s+countSpan\.textContent = `\(\$\{categoryCounts\[category\] \|\| 0\}\)`;\n', '\n', js)
js = re.sub(r'\s+categoryContainer\.appendChild\(checkbox\);\n', '\n', js)
js = re.sub(r'\s+categoryContainer\.appendChild\(label\);\n', '\n', js)
js = re.sub(r'\s+categoryFilters\.appendChild\(categoryContainer\);\n', '\n', js)
js = re.sub(r'\s+const checkbox = document\.getElementById\(`category-\$\{category\}`\);\n', '\n', js)
js = re.sub(r'\s+\? `Clear \$\{label\} category filter`\n', '\n', js)
js = re.sub(r'\s+: `Show \$\{label\} category`\n', '\n', js)


with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
