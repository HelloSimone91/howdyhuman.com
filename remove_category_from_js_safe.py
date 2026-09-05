import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Variables and structures to remove entirely
# 1. seoCategoryTranslations object
js = re.sub(r'\nconst seoCategoryTranslations = \{.*?\};\n', '\n', js, flags=re.DOTALL)

# 2. localizedCategoryLabels object
js = re.sub(r'\nconst localizedCategoryLabels = \{.*?\};\n', '\n', js, flags=re.DOTALL)

# 3. getCategoryLabel function
js = re.sub(r'\nfunction getCategoryLabel\(category\) \{.*?\}\n', '\n', js, flags=re.DOTALL)

# 4. updateSeoCategoryIndex function
js = re.sub(r'\nfunction updateSeoCategoryIndex\(\) \{.*?\}\n', '\n', js, flags=re.DOTALL)

# 5. setCategoryFilter function
js = re.sub(r'\nfunction setCategoryFilter\(category, isSelected\) \{.*?\}\n', '\n', js, flags=re.DOTALL)

# 6. updateCategoryBadgeStates function
js = re.sub(r'\nfunction updateCategoryBadgeStates\(\) \{.*?\}\n', '\n', js, flags=re.DOTALL)


# Variables referencing category to clean up:
# initialization
js = re.sub(r'\s+categoryFilters = document\.getElementById\(\'categoryFilters\'\);\n', '\n', js)
js = re.sub(r'\s+categoryFilterSearch = document\.getElementById\(\'categoryFilterSearch\'\);\n', '\n', js)

# clearing category filters block
js = re.sub(r'\s+if \(categoryFilters\) categoryFilters\.innerHTML = \'\';\n', '\n', js)

# the entire category filter populating block
js = re.sub(r'\s+// Populate category filters\n\s+if \(categoryFilters\) \{.*?\}\n\s+\}\n\n\s+// Setup tag filters', '\n\n        // Setup tag filters', js, flags=re.DOTALL)

# calls to attachFilterSearchListener for category
js = re.sub(r'\s+attachFilterSearchListener\(categoryFilterSearch, categoryFilters\);\n', '\n', js)

# filterState modifications
js = re.sub(r'\s+categories: \[\],\n', '\n', js)
js = re.sub(r'\s+filterState\.categories = \[\];\n', '\n', js)

# calls to updateSeoCategoryIndex
js = re.sub(r'\s+updateSeoCategoryIndex\(\);\n', '\n', js)
js = re.sub(r'\s+updateCategoryBadgeStates\(\);\n', '\n', js)

# logic checking filterState.categories
js = re.sub(r'\s+// Filter by categories\n\s+if \(filterState\.categories\.length > 0\) \{.*?\s+\}\n', '\n', js, flags=re.DOTALL)
js = re.sub(r'\s+if \(!filterState\.categories\.includes\(value\.category\)\) \{\n\s+filterState\.categories\.push\(value\.category\);\n\s+\}\n', '\n', js)


# category badge appending
js = re.sub(r'\s+// Add category filters\n\s+filterState\.categories\.forEach\(category => \{\n\s+addActiveFilterBadge\(getCategoryLabel\(category\), \'category\', category\);\n\s+\}\);\n', '\n', js)

# removeButton category logic
js = re.sub(r'\s+removeButton\.innerHTML = type === \'category\'\n\s+\? \'<span class="active-filter__clear-text">Clear</span><i class="fas fa-times-circle" aria-hidden="true"></i>\'\n\s+: \'<i class="fas fa-times-circle" aria-hidden="true"></i>\';\n', '    removeButton.innerHTML = \'<i class="fas fa-times-circle" aria-hidden="true"></i>\';\n', js)

# removeButton event listener category logic
js = re.sub(r'\s+if \(type === \'category\'\) \{\n\s+setCategoryFilter\(rawText, false\);\n\s+\} else if \(type === \'tag\'\)', '        if (type === \'tag\')', js)
js = re.sub(r'\s+if \(type === \'category\'\) \{\n\s+icon\.classList\.add\(\'fas\', \'fa-folder\'\);\n\s+\} else ', '    ', js)


# filterState.sortMethod category logic
js = re.sub(r'\s+\} else if \(filterState\.sortMethod === \'category\'\) \{\n\s+filtered\.sort\(\(a, b\) => compareByName\(a\.category, b\.category\) \|\| compareByName\(a\.name, b\.name\)\);\n', '\n', js)

# value card category button block
js = re.sub(r'\s+const category = document\.createElement\(\'button\'\);\n\s+category\.type = \'button\';\n\s+category\.textContent = getCategoryLabel\(value\.category\);\n\s+category\.classList\.add\(\'category-badge\'\);\n\s+category\.dataset\.category = value\.category;\n\s+category\.dataset\.categoryLabel = getCategoryLabel\(value\.category\);\n\s+category\.setAttribute\(\'aria-pressed\', filterState\.categories\.includes\(value\.category\) \? \'true\' : \'false\'\);\n', '\n', js)
js = re.sub(r'\s+category\.addEventListener\(\'click\', \(\) => \{.*?\n\s+\}\);\n', '\n', js, flags=re.DOTALL)
js = re.sub(r'\s+category\.classList\.add\(\'category-badge--gallery\'\);\n\s+previewContainer\.appendChild\(category\);\n', '\n', js)
js = re.sub(r'\s+header\.appendChild\(category\);\n', '\n', js)


with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
