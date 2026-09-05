import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the reduce block
def replace_reduce(match):
    return '''        const { verbCounts } = values.reduce((acc, value) => {
            if (Array.isArray(value.tags)) {
                value.tags.forEach(tag => {
                    acc.verbCounts[tag] = (acc.verbCounts[tag] || 0) + 1;
                });
            }
            return acc;
        }, { verbCounts: {} });'''

js = re.sub(r'        const \{ categoryCounts, verbCounts \} = values\.reduce\(\(acc, value\) => \{.*?\}, \{ categoryCounts: \{\}, verbCounts: \{\} \}\);', replace_reduce, js, flags=re.DOTALL)

# Remove the populate category filters block
js = re.sub(r'        // Populate category filters\n        if \(categoryFilters\) \{.*?        \}\n\n        // Setup tag filters', '        // Setup tag filters', js, flags=re.DOTALL)


# calls to attachFilterSearchListener for category
js = re.sub(r'\s+attachFilterSearchListener\(categoryFilterSearch, categoryFilters\);\n', '\n', js)

# filterState modifications
js = re.sub(r'\s+categories: \[\],\n', '\n', js)
js = re.sub(r'\s+filterState\.categories = \[\];\n', '\n', js)

# calls to updateSeoCategoryIndex
js = re.sub(r'\s+updateSeoCategoryIndex\(\);\n', '\n', js)
js = re.sub(r'\s+updateCategoryBadgeStates\(\);\n', '\n', js)

# logic checking filterState.categories
js = re.sub(r'\s+// Filter by categories\n\s+if \(filterState\.categories\.length > 0\) \{.*?\n\s+\}\n', '\n', js, flags=re.DOTALL)
js = re.sub(r'\s+if \(!filterState\.categories\.includes\(value\.category\)\) \{\n\s+filterState\.categories\.push\(value\.category\);\n\s+\}\n', '\n', js)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
