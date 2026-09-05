import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove the block populating categoryFilters (the whole if (categoryFilters) { ... })
js = re.sub(r'        // Populate category filters\n        if \(categoryFilters\) \{.*?        \}\n', '', js, flags=re.DOTALL)

# Remove the match in filterValues loop (the categoryCounts block)
# It starts with: const { categoryCounts, verbCounts } = values.reduce((acc, value) => {
# and goes until }, { categoryCounts: {}, verbCounts: {} });
# We should probably just leave verbCounts intact, let's replace it
def replace_reduce(match):
    return '''        const { verbCounts } = values.reduce((acc, value) => {
            value.tags.forEach(tag => {
                acc.verbCounts[tag] = (acc.verbCounts[tag] || 0) + 1;
            });
            return acc;
        }, { verbCounts: {} });'''

js = re.sub(r'        const \{ categoryCounts, verbCounts \} = values\.reduce\(\(acc, value\) => \{.*?\}, \{ categoryCounts: \{\}, verbCounts: \{\} \}\);', replace_reduce, js, flags=re.DOTALL)

# Remove calls to updateSeoCategoryIndex()
js = re.sub(r'\s+updateSeoCategoryIndex\(\);\n', '\n', js)

# In filterValues():
# Remove categoryMatch logic
js = re.sub(r'\s+const categoryMatch =\n\s+value\.category\.toLowerCase\(\)\.includes\(filterState\.searchTerm\) \|\|\n\s+getCategoryLabel\(value\.category\)\.toLowerCase\(\)\.includes\(filterState\.searchTerm\);\n\n\s+return nameMatch \|\| descriptionMatch \|\| exampleMatch \|\| tagMatch \|\| categoryMatch;', '\n                return nameMatch || descriptionMatch || exampleMatch || tagMatch;', js)
js = re.sub(r'\s+const categoryMatch =\n\s+value\.category\.toLowerCase\(\)\.includes\(filterState\.searchTerm\);\n\n\s+return nameMatch \|\| descriptionMatch \|\| exampleMatch \|\| tagMatch \|\| categoryMatch;', '\n                return nameMatch || descriptionMatch || exampleMatch || tagMatch;', js)


# Remove filter by categories block
js = re.sub(r'        // Filter by categories\n        if \(filterState\.categories\.length > 0\) \{.*?\n        \}\n', '', js, flags=re.DOTALL)

# In sort results:
js = re.sub(r'        \} else if \(filterState\.sortMethod === \'category\'\) \{.*?\n        \}', '', js, flags=re.DOTALL)

# Remove attachFilterSearchListener(categoryFilterSearch, categoryFilters);
js = re.sub(r'\s+attachFilterSearchListener\(categoryFilterSearch, categoryFilters\);\n', '\n', js)


with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
