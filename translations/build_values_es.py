import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

with open(BASE_DIR / 'translations' / 'es_values_data.json', 'r', encoding='utf-8') as f:
    es_values = json.load(f)

with open(BASE_DIR / 'Values-en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

missing = [v['name'] for v in en_data['values'] if v['name'] not in es_values]
if missing:
    raise SystemExit(f"Missing translations for: {missing}")

values_es = []
for value in en_data['values']:
    es_entry = es_values[value['name']]
    values_es.append({
        'name': es_entry['name'],
        'description': es_entry['description'],
        'example': es_entry['example'],
        'category': es_entry.get('category', value['category']),
        'tags': es_entry['tags'],
        'language': 'es'
    })

output_path = BASE_DIR / 'Values-es.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump({'values': values_es}, f, ensure_ascii=False, indent=2)

csv_path = BASE_DIR / 'translations' / 'Values-translation.csv'
with open(csv_path, 'w', encoding='utf-8') as f:
    headers = ['name_en', 'description_en', 'example_en', 'category_en', 'tags_en',
               'name_es', 'description_es', 'example_es', 'category_es', 'tags_es']
    f.write(','.join(headers) + '\n')
    for en_value, es_value in zip(en_data['values'], values_es):
        row = [
            en_value['name'],
            en_value['description'],
            en_value['example'],
            en_value['category'],
            '; '.join(en_value['tags']),
            es_value['name'],
            es_value['description'],
            es_value['example'],
            es_value['category'],
            '; '.join(es_value['tags'])
        ]
        f.write('"' + '","'.join(cell.replace('"', '""') for cell in row) + '"\n')

print(f"Wrote {len(values_es)} values to {output_path}")
print(f"Wrote translation spreadsheet to {csv_path}")
