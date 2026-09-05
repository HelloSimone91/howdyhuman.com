import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# category badge appending in active filters
js = re.sub(r'\s+// Add category filters\n\s+filterState\.categories\.forEach\(category => \{\n\s+addActiveFilterBadge\(getCategoryLabel\(category\), \'category\', category\);\n\s+\}\);\n', '\n', js)

# removeButton category logic
js = re.sub(r'\s+removeButton\.innerHTML = type === \'category\'\n\s+\? \'<span class="active-filter__clear-text">Clear</span><i class="fas fa-times-circle" aria-hidden="true"></i>\'\n\s+: \'<i class="fas fa-times-circle" aria-hidden="true"></i>\';\n', '    removeButton.innerHTML = \'<i class="fas fa-times-circle" aria-hidden="true"></i>\';\n', js)

# removeButton event listener category logic
js = re.sub(r'\s+if \(type === \'category\'\) \{\n\s+setCategoryFilter\(rawText, false\);\n\s+\} else if \(type === \'tag\'\)', '        if (type === \'tag\')', js)
js = re.sub(r'\s+if \(type === \'category\'\) \{\n\s+icon\.classList\.add\(\'fas\', \'fa-folder\'\);\n\s+\} else ', '    ', js)

# filterState.sortMethod category logic
js = re.sub(r'\s+\} else if \(filterState\.sortMethod === \'category\'\) \{\n\s+filtered\.sort\(\(a, b\) => compareByName\(a\.category, b\.category\) \|\| compareByName\(a\.name, b\.name\)\);\n', '\n', js)

# In filterValues(): Remove categoryMatch logic
js = re.sub(r'\s+const categoryMatch =\n\s+value\.category\.toLowerCase\(\)\.includes\(filterState\.searchTerm\) \|\|\n\s+getCategoryLabel\(value\.category\)\.toLowerCase\(\)\.includes\(filterState\.searchTerm\);\n\n\s+return nameMatch \|\| descriptionMatch \|\| exampleMatch \|\| tagMatch \|\| categoryMatch;', '\n                return nameMatch || descriptionMatch || exampleMatch || tagMatch;', js)

js = re.sub(r'\s+const categoryMatch =\n\s+value\.category\.toLowerCase\(\)\.includes\(filterState\.searchTerm\);\n\n\s+return nameMatch \|\| descriptionMatch \|\| exampleMatch \|\| tagMatch \|\| categoryMatch;', '\n                return nameMatch || descriptionMatch || exampleMatch || tagMatch;', js)


# value card category button block
js = re.sub(r'\s+const category = document\.createElement\(\'button\'\);\n\s+category\.type = \'button\';\n\s+category\.textContent = getCategoryLabel\(value\.category\);\n\s+category\.classList\.add\(\'category-badge\'\);\n\s+category\.dataset\.category = value\.category;\n\s+category\.dataset\.categoryLabel = getCategoryLabel\(value\.category\);\n\s+category\.setAttribute\(\'aria-pressed\', filterState\.categories\.includes\(value\.category\) \? \'true\' : \'false\'\);\n', '\n', js)
js = re.sub(r'\s+category\.addEventListener\(\'click\', \(\) => \{.*?\n\s+\}\);\n', '\n', js, flags=re.DOTALL)
js = re.sub(r'\s+category\.classList\.add\(\'category-badge--gallery\'\);\n\s+previewContainer\.appendChild\(category\);\n', '\n', js)
js = re.sub(r'\s+header\.appendChild\(category\);\n', '\n', js)
js = re.sub(r'\s+category: otherValue\.category,\n', '\n', js)
js = re.sub(r'\.tag, \.related-value-card, \.category-badge, \.value-card-toggle', '.tag, .related-value-card, .value-card-toggle', js)
js = re.sub(r'\s+li\.textContent = `\$\{v\.name\} - \$\{getCategoryLabel\(v\.category\)\}`;', '                li.textContent = v.name;', js)


# Remove specific localized string lines
js = re.sub(r'\s+indexHeading: \'Browse by category\',\n', '\n', js)
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

# Remove categories from let active filters list
js = re.sub(r'tagFilters, categoryFilters, ', 'tagFilters, ', js)
js = re.sub(r'categoryFilterSearch, tagFilterSearch, ', 'tagFilterSearch, ', js)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
