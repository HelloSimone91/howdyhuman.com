import html
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / 'Values-en.json'
SITE_URL = 'https://www.howdyhuman.com'


def slugify(text: str) -> str:
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')
    return slug or 'item'


def safe_excerpt(text: str, limit: int = 160) -> str:
    clean = ' '.join(text.split())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rsplit(' ', 1)[0] + '…'


def render_json_ld(data: dict) -> str:
    rendered = json.dumps(data, ensure_ascii=False, indent=2)
    return rendered.replace('</', '<\\/')


def breadcrumb_schema(items: list[tuple[str, str]]) -> dict:
    return {
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': index + 1,
                'name': name,
                'item': url,
            }
            for index, (name, url) in enumerate(items)
        ],
    }


def breadcrumb_nav(items: list[tuple[str, str | None]]) -> str:
    parts = []
    last_index = len(items) - 1
    for index, (label, href) in enumerate(items):
        escaped_label = html.escape(label)
        if index == last_index or not href:
            parts.append(f'<span aria-current="page">{escaped_label}</span>')
            continue

        parts.append(f'<a href="{html.escape(href)}">{escaped_label}</a>')
        parts.append('<span aria-hidden="true">/</span>')

    return f'<nav class="breadcrumbs" aria-label="Breadcrumb">{"".join(parts)}</nav>'


def html_page(
    title: str,
    description: str,
    canonical_path: str,
    body: str,
    *,
    head_extra: str = '',
    robots: str | None = None,
) -> str:
    canonical_url = f'{SITE_URL}{canonical_path}'
    robots_meta = f'  <meta name="robots" content="{html.escape(robots)}" />\n' if robots else ''
    extra = f'{head_extra.rstrip()}\n' if head_extra else ''

    return f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
  <title>{html.escape(title)}</title>
  <meta name=\"description\" content=\"{html.escape(description)}\" />
{robots_meta}  <link rel=\"canonical\" href=\"{html.escape(canonical_url)}\" />
  <meta property=\"og:site_name\" content=\"Howdy Human\" />
  <meta property=\"og:title\" content=\"{html.escape(title)}\" />
  <meta property=\"og:description\" content=\"{html.escape(description)}\" />
  <meta property=\"og:type\" content=\"website\" />
  <meta property=\"og:url\" content=\"{html.escape(canonical_url)}\" />
  <meta name=\"twitter:card\" content=\"summary\" />
  <link rel=\"icon\" type=\"image/x-icon\" href=\"/favicon.ico\" />
  <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon.png\" />
{extra}  <style>
    body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.55; margin: 0; color: #1f2a2a; background: #edf4ef; }}
    main {{ max-width: 760px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }}
    article {{ background: #fff; border: 1px solid #d8e3db; border-radius: 16px; padding: 1.5rem; box-shadow: 0 8px 24px rgba(0,0,0,.05); }}
    h1 {{ margin-top: 0; line-height: 1.2; }}
    h2 {{ margin-top: 1.5rem; font-size: 1.1rem; }}
    p {{ margin: .65rem 0; }}
    ul {{ margin: .5rem 0 0; padding-left: 1.1rem; }}
    a {{ color: #225f45; }}
    .meta {{ color: #495452; font-size: .95rem; }}
    .breadcrumbs {{ display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin-bottom: 1rem; color: #5f6f68; font-size: .9rem; }}
    .breadcrumbs a {{ color: #225f45; text-decoration: none; }}
    .breadcrumbs a:hover {{ text-decoration: underline; }}
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


def ensure_clean_directory(parent: Path, valid_slugs: set[str]) -> None:
    for child in parent.iterdir():
        if child.is_dir() and child.name not in valid_slugs:
            for nested in child.rglob('*'):
                if nested.is_file():
                    nested.unlink()
            for nested in sorted(child.rglob('*'), reverse=True):
                if nested.is_dir():
                    nested.rmdir()
            child.rmdir()


def write_sitemap(value_slugs: list[str]) -> None:
    urls = [f'{SITE_URL}/', f'{SITE_URL}/values-as-verbs/']
    urls.extend(f'{SITE_URL}/values/{slug}/' for slug in value_slugs)

    sitemap = '\n'.join(
        ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        + [f'  <url><loc>{url}</loc></url>' for url in urls]
        + ['</urlset>', '']
    )
    (ROOT / 'sitemap.xml').write_text(sitemap, encoding='utf-8')


def value_meta_description(name: str, description: str, example: str) -> str:
    if example:
        return safe_excerpt(f'{name}: {description} Example: {example}', 158)
    return safe_excerpt(f'{name}: {description}', 158)


def build_value_page(value: dict, values_by_tag: dict[str, list[dict]]) -> tuple[str, str]:
    name = value['name']
    slug = slugify(name)
    description = value['description']
    example = value.get('example', '')
    category = value.get('category', 'Uncategorized')
    tags = [t for t in value.get('tags', []) if t]
    canonical_path = f'/values/{slug}/'
    canonical_url = f'{SITE_URL}{canonical_path}'

    title = f'{name} Value Meaning & Example | Howdy Human'
    meta_description = value_meta_description(name, description, example)

    tag_links = ''.join(
        f'<a class="chip" href="/verbs/{slugify(tag)}/">{html.escape(tag)}</a>' for tag in tags
    ) or '<p class="meta">No related verbs listed.</p>'

    related_values = []
    for tag in tags[:3]:
        related_values.extend(v for v in values_by_tag.get(tag, []) if v['name'] != name)

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

    structured_data = render_json_ld({
        '@context': 'https://schema.org',
        '@graph': [
            breadcrumb_schema([
                ('Home', f'{SITE_URL}/'),
                ('Values', f'{SITE_URL}/#dictionary-panel'),
                (name, canonical_url),
            ]),
            {
                '@type': 'DefinedTerm',
                '@id': f'{canonical_url}#definedterm',
                'name': name,
                'description': description,
                'url': canonical_url,
                'inDefinedTermSet': {
                    '@type': 'DefinedTermSet',
                    '@id': f'{SITE_URL}/#values',
                    'name': 'Howdy Human Dictionary of Values',
                    'url': f'{SITE_URL}/',
                },
            },
        ],
    })
    head_extra = f'  <script type="application/ld+json">\n{structured_data}\n  </script>'

    body = f"""
<article>
  {breadcrumb_nav([('Home', '/'), ('Values', '/#dictionary-panel'), (name, None)])}
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
    return slug, html_page(title, meta_description, canonical_path, body, head_extra=head_extra)


def build_verb_page(tag: str, values_for_tag: list[dict]) -> tuple[str, str]:
    slug = slugify(tag)
    canonical_path = f'/verbs/{slug}/'
    canonical_url = f'{SITE_URL}{canonical_path}'
    value_links = ''.join(
        f'<li><a href="/values/{slugify(item["name"])}/">{html.escape(item["name"])}</a> — {html.escape(safe_excerpt(item["description"], 120))}</li>'
        for item in sorted(values_for_tag, key=lambda v: v['name'])
    )
    count = len(values_for_tag)
    title = f"Values that embody '{tag}' | Howdy Human"
    desc = safe_excerpt(f"Discover {count} values connected to the verb '{tag}' in the Howdy Human Dictionary of Values.")
    structured_data = render_json_ld({
        '@context': 'https://schema.org',
        '@graph': [
            breadcrumb_schema([
                ('Home', f'{SITE_URL}/'),
                ('Verbs', f'{SITE_URL}/#dictionary-panel'),
                (tag, canonical_url),
            ]),
        ],
    })
    head_extra = f'  <script type="application/ld+json">\n{structured_data}\n  </script>'

    body = f"""
<article>
  {breadcrumb_nav([('Home', '/'), ('Verbs', '/#dictionary-panel'), (tag, None)])}
  <h1>Verb: {html.escape(tag)}</h1>
  <p>This page collects values that are commonly lived through the action <strong>{html.escape(tag)}</strong>.</p>
  <p class=\"meta\">{count} related value{'s' if count != 1 else ''}</p>
  <ul>{value_links}</ul>
</article>
"""
    return slug, html_page(title, desc, canonical_path, body, head_extra=head_extra, robots='noindex,follow')


def write_homepage_value_fallback(values: list[dict]) -> None:
    index_path = ROOT / 'index.html'
    page = index_path.read_text(encoding='utf-8')

    grouped: dict[str, list[dict]] = {}
    for value in sorted(values, key=lambda item: item['name'].lower()):
        letter = value['name'][0].upper()
        grouped.setdefault(letter, []).append(value)

    sections = []
    for letter, letter_values in grouped.items():
        cards = []
        for value in letter_values:
            name = value['name']
            slug = slugify(name)
            description = safe_excerpt(value.get('description', ''), 180)
            category = value.get('category', 'Uncategorized')
            cards.append(f"""
                            <article class="value-card p-4 rounded-md shadow-sm mb-4 seo-value-card">
                                <h3 class="text-xl font-bold mb-2">
                                    <a href="/values/{slug}/">{html.escape(name)}</a>
                                </h3>
                                <p class="meta"><strong>Category:</strong> {html.escape(category)}</p>
                                <p>{html.escape(description)}</p>
                            </article>""")

        sections.append(f"""
                        <section class="seo-letter-section" aria-labelledby="seo-section-{html.escape(letter)}">
                            <h2 id="seo-section-{html.escape(letter)}" class="text-2xl font-bold mt-8 mb-4 py-2 border-b border-gray-300 letter-section">{html.escape(letter)}</h2>
                            {''.join(cards)}
                        </section>""")

    fallback = '\n'.join([
        '<!-- SEO_VALUE_FALLBACK_START -->',
        '<noscript><p>Browse the full Howdy Human Dictionary of Values below.</p></noscript>',
        *sections,
        '<!-- SEO_VALUE_FALLBACK_END -->',
    ])

    marker_pattern = re.compile(
        r'<!-- SEO_VALUE_FALLBACK_START -->.*?<!-- SEO_VALUE_FALLBACK_END -->',
        re.DOTALL,
    )
    if marker_pattern.search(page):
        page = marker_pattern.sub(fallback, page)
    else:
        page = page.replace('<!-- Values cards will be added here by JavaScript -->', fallback)

    page = '\n'.join(line.rstrip() for line in page.splitlines()) + '\n'
    index_path.write_text(page, encoding='utf-8')


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

    value_slugs = {slugify(value['name']) for value in values}
    verb_slugs = {slugify(tag) for tag in values_by_tag}

    ensure_clean_directory(values_dir, value_slugs)
    ensure_clean_directory(verbs_dir, verb_slugs)

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

    write_sitemap(sorted(value_slugs))
    write_homepage_value_fallback(values)

    print(
        f'Generated {len(values)} value pages, {len(values_by_tag)} verb pages, '
        f'refreshed sitemap.xml, and updated homepage fallback links.'
    )


if __name__ == '__main__':
    main()
