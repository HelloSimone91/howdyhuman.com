import re

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. seoCategoryTranslations object
js = re.sub(r'\nconst seoCategoryTranslations = \{.*?\n\};\n', '\n', js, flags=re.DOTALL)

# 2. localizedCategoryLabels object
js = re.sub(r'\nconst localizedCategoryLabels = \{.*?\n\};\n', '\n', js, flags=re.DOTALL)

# 3. getCategoryLabel function
js = re.sub(r'\nfunction getCategoryLabel\(category\) \{.*?\n\}\n', '\n', js, flags=re.DOTALL)

# 4. updateSeoCategoryIndex function
js = re.sub(r'\nfunction updateSeoCategoryIndex\(\) \{.*?\n\}\n', '\n', js, flags=re.DOTALL)

# 5. setCategoryFilter function
js = re.sub(r'\nfunction setCategoryFilter\(category, isSelected\) \{.*?\n\}\n', '\n', js, flags=re.DOTALL)

# 6. updateCategoryBadgeStates function
js = re.sub(r'\nfunction updateCategoryBadgeStates\(\) \{.*?\n\}\n', '\n', js, flags=re.DOTALL)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)
