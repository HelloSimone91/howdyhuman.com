import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove seoCategoryTranslations object
js = re.sub(r'const seoCategoryTranslations = \{.*?\};\n', '', js, flags=re.DOTALL)

# Remove localizedCategoryLabels object
js = re.sub(r'const localizedCategoryLabels = \{.*?\};\n', '', js, flags=re.DOTALL)

# Remove getCategoryLabel function
js = re.sub(r'function getCategoryLabel\(category\) \{.*?\}\n', '', js, flags=re.DOTALL)

# Remove updateSeoCategoryIndex function
js = re.sub(r'function updateSeoCategoryIndex\(\) \{.*?\}\n', '', js, flags=re.DOTALL)

# Remove setCategoryFilter function
js = re.sub(r'function setCategoryFilter\(category, isSelected\) \{.*?\}\n', '', js, flags=re.DOTALL)

# Remove updateCategoryBadgeStates function
js = re.sub(r'function updateCategoryBadgeStates\(\) \{.*?\}\n', '', js, flags=re.DOTALL)

# Remove categoryFilter blocks in initialization
js = re.sub(r'        categoryFilters = document.getElementById\(\'categoryFilters\'\);\n', '', js)
js = re.sub(r'        categoryFilterSearch = document.getElementById\(\'categoryFilterSearch\'\);\n', '', js)

# Remove the block: if (categoryFilters) categoryFilters.innerHTML = '';
js = re.sub(r'        if \(categoryFilters\) categoryFilters\.innerHTML = \'\';\n', '', js)

# Remove filterState.categories declaration
js = re.sub(r'\s+categories: \[\],\n', '\n', js)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
