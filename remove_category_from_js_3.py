import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove remaining block: categories.forEach(category => { ... })
js = re.sub(r'\s+// Create category filters\n\s+categories\.forEach\(category => \{.*?\n\s+\}\);\n', '', js, flags=re.DOTALL)

# Remove categories from let active filters list
js = re.sub(r'tagFilters, categoryFilters, ', 'tagFilters, ', js)
js = re.sub(r'categoryFilterSearch, tagFilterSearch, ', 'tagFilterSearch, ', js)

# Remove badge.className = 'text-sm opacity-75 category-badge';
js = re.sub(r'\s+badge\.className = \'text-sm opacity-75 category-badge\';\n\s+badge\.textContent = getCategoryLabel\(value\.category\);\n', '\n', js)

# Remove filterState.categories from clearAllFilters and others
js = re.sub(r'\s+filterState\.categories = \[\];\n', '\n', js)
js = re.sub(r'\s+filterState\.categories = filterState\.categories\.filter.*?;\n', '\n', js)

# Remove badge.title logic
js = re.sub(r'\s+badge\.title = isSelected \? \'Click to clear this category filter\' : \'Click to filter by this category\';\n', '\n', js)

# Remove the updateCategoryBadgeStates calls
js = re.sub(r'\s+updateCategoryBadgeStates\(\);\n', '\n', js)

# Remove Add category filters
js = re.sub(r'\s+// Add category filters\n\s+filterState\.categories\.forEach\(category => \{\n\s+addActiveFilterBadge\(getCategoryLabel\(category\), \'category\', category\);\n\s+\}\);\n', '\n', js)

# Remove addActiveFilterBadge logic for category
js = re.sub(r'\s+if \(type === \'category\'\) \{\n\s+icon\.classList\.add\(\'fas\', \'fa-folder\'\);\n\s+\} else ', '    ', js)

# Remove button logic for category
js = re.sub(r'\s+removeButton\.innerHTML = type === \'category\'\n\s+\? \'<span class="active-filter__clear-text">Clear</span><i class="fas fa-times-circle" aria-hidden="true"></i>\'\n\s+: \'<i class="fas fa-times-circle" aria-hidden="true"></i>\';\n', '    removeButton.innerHTML = \'<i class="fas fa-times-circle" aria-hidden="true"></i>\';\n', js)
js = re.sub(r'\s+if \(type === \'category\'\) \{\n\s+setCategoryFilter\(rawText, false\);\n\s+\} else if', '        if', js)


# Remove widenFiltersForValue category
js = re.sub(r'\s+if \(!filterState\.categories\.includes\(value\.category\)\) \{\n\s+filterState\.categories\.push\(value\.category\);\n\s+\}\n', '\n', js)

# Remove otherValue.category assignment
js = re.sub(r'\s+category: otherValue\.category,\n', '\n', js)

# Remove category rendering in displayValues
js = re.sub(r'\s+const category = document\.createElement\(\'button\'\);\n\s+category\.type = \'button\';\n\s+category\.textContent = getCategoryLabel\(value\.category\);\n\s+category\.classList\.add\(\'category-badge\'\);\n\s+category\.dataset\.category = value\.category;\n\s+category\.dataset\.categoryLabel = getCategoryLabel\(value\.category\);\n\s+category\.setAttribute\(\'aria-pressed\', filterState\.categories\.includes\(value\.category\) \? \'true\' : \'false\'\);\n', '', js)
js = re.sub(r'\s+category\.addEventListener\(\'click\', \(\) => \{.*?\n\s+\}\);\n', '', js, flags=re.DOTALL)
js = re.sub(r'\s+category\.classList\.add\(\'category-badge--gallery\'\);\n\s+previewContainer\.appendChild\(category\);\n', '', js)
js = re.sub(r'\s+header\.appendChild\(category\);\n', '', js)

# Remove closest check for category-badge
js = re.sub(r'\.tag, \.related-value-card, \.category-badge, \.value-card-toggle', '.tag, .related-value-card, .value-card-toggle', js)

# Remove li.textContent = `${v.name} - ${getCategoryLabel(v.category)}`;
js = re.sub(r'\s+li\.textContent = `\$\{v\.name\} - \$\{getCategoryLabel\(v\.category\)\}`;', '                li.textContent = v.name;', js)


with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
