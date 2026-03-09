import html
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / 'Values-en.json'
SITE_URL = 'https://howdyhuman.com'


def slugify(text: str) -> str:
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')
    return slug or 'item'


def safe_excerpt(text: str, limit: int = 160) -> str:
    clean = ' '.join(text.split())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rsplit(' ', 1)[0] + '…'


def html_page(title: str, description: str, canonical_path: str, body: str) -> str:
    canonical_url = f"{SITE_URL}{canonical_path}"
    return f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>{html.escape(title)}</title>
  <meta name=\"description\" content=\"{html.escape(description)}\" />
  <link rel=\"canonical\" href=\"{html.escape(canonical_url)}\" />
  <meta property=\"og:title\" content=\"{html.escape(title)}\" />
  <meta property=\"og:description\" content=\"{html.escape(description)}\" />
  <meta property=\"og:type\" content=\"website\" />
  <meta property=\"og:url\" content=\"{html.escape(canonical_url)}\" />
  <meta name=\"twitter:card\" content=\"summary\" />
  <style>
    body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.55; margin: 0; color: #1f2a2a; background: #edf4ef; }}
    main {{ max-width: 760px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }}
    article {{ background: #fff; border: 1px solid #d8e3db; border-radius: 16px; padding: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,.05); }}
    h1 {{ margin-top: 0; line-height: 1.2; }}
    h2 {{ margin-top: 1.5rem; font-size: 1.1rem; }}
    p {{ margin: .65rem 0; }}
    ul {{ margin: .5rem 0 0; padding-left: 1.1rem; }}
    a {{ color: #225f45; }}
    .meta {{ color: #495452; font-size: .95rem; }}
    .chip {{ display: inline-block; border: 1px solid #b8c8be; border-radius: 999px; padding: .2rem .65rem; margin: .2rem .35rem .2rem 0; font-size: .85rem; text-decoration: none; color: #234834; }}
  </style>
</head>
<body>
  <main>
    {body}
  </main>
</body>
</html>
"""


def build_value_page(value: dict, values_by_tag: dict[str, list[dict]]) -> tuple[str, str]:
    name = value['name']
    slug = slugify(name)
    description = value['description']
    example = value.get('example', '')
    category = value.get('category', 'Uncategorized')
    tags = [t for t in value.get('tags', []) if t]

    title = f"{name} Value Meaning & Example | Howdy Human"
    meta_description = safe_excerpt(f"Learn the value of {name.lower()}: {description}")

    tag_links = ''.join(
        f'<a class="chip" href="/verbs/{slugify(tag)}/">{html.escape(tag)}</a>' for tag in tags
    ) or '<p class="meta">No related verbs listed.</p>'

    related_values = []
    for tag in tags[:3]:
        related_values.extend(v for v in values_by_tag.get(tag, []) if v['name'] != name)

    # Deduplicate while preserving order
    seen = set()
    unique_related = []
    for item in related_values:
        if item['name'] in seen:
            continue
        seen.add(item['name'])
        unique_related.append(item)

    related_markup = ''.join(
        f'<li><a href="/values/{slugify(item["name"])}/">{html.escape(item["name"])}</a></li>'
        for item in unique_related[:8]
    )
    if not related_markup:
        related_markup = '<li>Explore more in the full dictionary.</li>'

    body = f"""
<article>
  <p class=\"meta\"><a href=\"/\">← Back to the dictionary</a></p>
  <h1>{html.escape(name)}</h1>
  <p class=\"meta\"><strong>Category:</strong> {html.escape(category)}</p>
  <p>{html.escape(description)}</p>
  <h2>Example in action</h2>
  <p>{html.escape(example)}</p>
  <h2>Associated verbs</h2>
  <div>{tag_links}</div>
  <h2>Related values</h2>
  <ul>{related_markup}</ul>
</article>
"""
    return slug, html_page(title, meta_description, f'/values/{slug}/', body)


def build_verb_page(tag: str, values_for_tag: list[dict]) -> tuple[str, str]:
    slug = slugify(tag)
    value_links = ''.join(
        f'<li><a href="/values/{slugify(item["name"])}/">{html.escape(item["name"])}</a> — {html.escape(safe_excerpt(item["description"], 120))}</li>'
        for item in sorted(values_for_tag, key=lambda v: v['name'])
    )
    count = len(values_for_tag)
    title = f"Values that embody '{tag}' | Howdy Human"
    desc = safe_excerpt(f"Discover {count} values connected to the verb '{tag}' in the Howdy Human Dictionary of Values.")

    body = f"""
<article>
  <p class=\"meta\"><a href=\"/\">← Back to the dictionary</a></p>
  <h1>Verb: {html.escape(tag)}</h1>
  <p>This page collects values that are commonly lived through the action <strong>{html.escape(tag)}</strong>.</p>
  <p class=\"meta\">{count} related value{'s' if count != 1 else ''}</p>
  <ul>{value_links}</ul>
</article>
"""
    return slug, html_page(title, desc, f'/verbs/{slug}/', body)


def main() -> None:
    data = json.loads(DATA_FILE.read_text(encoding='utf-8'))
    values = data['values']

    values_dir = ROOT / 'values'
    verbs_dir = ROOT / 'verbs'
    values_dir.mkdir(exist_ok=True)
    verbs_dir.mkdir(exist_ok=True)

    values_by_tag: dict[str, list[dict]] = {}
    for value in values:
        for tag in value.get('tags', []):
            if not tag:
                continue
            values_by_tag.setdefault(tag, []).append(value)

    for value in values:
        slug, page = build_value_page(value, values_by_tag)
        out_dir = values_dir / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / 'index.html').write_text(page, encoding='utf-8')

    for tag, tagged_values in values_by_tag.items():
        slug, page = build_verb_page(tag, tagged_values)
        out_dir = verbs_dir / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / 'index.html').write_text(page, encoding='utf-8')

    print(f'Generated {len(values)} value pages and {len(values_by_tag)} verb pages.')


if __name__ == '__main__':
    main()
