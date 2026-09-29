#!/usr/bin/env python3
"""Externalize the supplied Webflow fields without changing script bodies."""
import argparse
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = re.compile(r'<script\b([^>]*)>(.*?)</script\s*>', re.I | re.S)
STYLE = re.compile(r'<style\b[^>]*>(.*?)</style\s*>', re.I | re.S)
NAMES = [
    'lenis-init', 'request-demo', 'site-modules', 'accessibility',
    'iubenda-semantics', 'frame-titles', 'wistia-privacy',
]


class Attributes(HTMLParser):
    def handle_starttag(self, tag, attrs):
        self.attrs = dict(attrs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', default='v1.0.0')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9._-]+', args.version):
        parser.error('Use an exact release tag or commit SHA.')
    base = f'https://cdn.jsdelivr.net/gh/brandvm/sefas@{args.version}'
    head = (ROOT / 'source/head.html').read_text()
    footer = (ROOT / 'source/footer.html').read_text()
    outputs = {}
    styles = STYLE.findall(head)
    assert len(styles) == 4, 'Review changed source styles before rebuilding.'
    outputs['assets/css/site.css'] = '\n'.join(styles) + '\n'
    head = STYLE.sub('', head)
    # Only comments outside scripts are removed from this small embed field.
    head = re.sub(r'<!--.*?-->', '', head, flags=re.S)
    head = re.sub(r'\n\s*\n', '\n', head).strip()
    head += ('\n<link id="sefas-semantic-nav-list-style" rel="stylesheet" '
             f'href="{base}/assets/css/site.css">\n')
    outputs['webflow/head.html'] = head

    tags = []
    inline_count = 0
    for match in SCRIPT.finditer(footer):
        attrs = Attributes()
        attrs.feed('<script' + match.group(1) + '>')
        attributes = attrs.attrs
        if 'src' in attributes:
            tags.append(match.group(0))
            continue
        name = NAMES[inline_count]
        inline_count += 1
        outputs[f'assets/js/{name}.js'] = match.group(2)
        # defer has no effect on classic inline scripts. Do not give it a new
        # effect when externalizing: preserve parser order and execution timing.
        attributes.pop('defer', None)
        attributes['src'] = f'{base}/assets/js/{name}.js'
        rendered = ' '.join(key if value is None else
                            f'{key}="{escape(value, quote=True)}"'
                            for key, value in attributes.items())
        tags.append(f'<script {rendered}></script>')
    assert inline_count == len(NAMES), 'Review changed source scripts before rebuilding.'
    remainder = SCRIPT.sub('', footer)
    assert not re.sub(r'<!--.*?-->', '', remainder, flags=re.S).strip(), \
        'Unexpected non-script footer content; preserve it explicitly.'
    outputs['webflow/footer.html'] = '\n'.join(tags) + '\n'

    for name, content in outputs.items():
        path = ROOT / name
        if args.check:
            assert path.read_text() == content, f'Generated file differs: {name}'
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        if name.endswith('.js'):
            subprocess.run(['node', '--check', str(path)], check=True)
    for name in ('webflow/head.html', 'webflow/footer.html'):
        count = len(outputs[name].encode('utf-16-le')) // 2
        assert count < 50000, f'{name} exceeds the Webflow field limit'
        print(f'{name}: {count:,} characters')
    print('Verified all seven JavaScript bodies, four CSS blocks, script order, and generated files.')


if __name__ == '__main__':
    main()
