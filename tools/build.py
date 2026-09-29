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
HEAD_SECTIONS = [
    ('<script type="text/javascript" src="https://embeds.iubenda.com/',
     '01 | Iubenda: loads the existing consent-management widget.'),
    ('<script>(function(w,d,s,l,i)',
     '02 | Google Tag Manager: loads container GTM-NQHZR3VG and initializes dataLayer.'),
    ('<script src="https://use.typekit.net/',
     '03 | Adobe Fonts: loads the Typekit kit, then initializes its fonts.'),
    ('<meta charset=',
     '04 | Existing metadata. The %%title%% and %%description%% values are template\n'
     '     placeholders from the original code. If your workflow does not replace\n'
     '     them, use Webflow page SEO settings for the real title and description.'),
    ('<link href="https://fonts.googleapis.com/',
     '05 | Google Fonts: loads Raleway for the existing form styles.'),
    ('<meta name="theme-color"',
     '06 | Browser theme color: SEFAS purple on browsers that support this setting.'),
    ('<link id="sefas-semantic-nav-list-style"',
     '07 | Site stylesheet: form styles, utility rules, Lenis, focus indicators,\n'
     '     contrast adjustments, skip-link styling, and semantic navigation lists.'),
]
FOOTER_SECTIONS = [
    '01 | Wistia: loads the video player asynchronously, as in the original code.',
    '02 | Lenis library: must load before the smooth-scroll initializer below.',
    '03 | Smooth scrolling: connects Lenis to the existing GSAP / ScrollTrigger ticker.',
    '04 | Demo links: opens the request-demo panel when the URL uses #request-demo.',
    '05 | Site modules: sliders, back-to-top buttons, click-on-load behavior,\n'
    '     shrinking navigation, styled text, and touch-button transitions.',
    '06 | Accessibility: skip link, French labels, quotations, filter status,\n'
    '     and keyboard / visibility behavior for the demo and navigation panels.',
    '07 | Iubenda button semantics: repairs the preferences button label markup.',
    '08 | Iframe accessibility: adds descriptive French titles to known embeds.',
    '09 | Wistia privacy: the additional supplied Iubenda integration.\n'
    '     Queues video privacy-setting updates; validate consent behavior on staging.',
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
    for marker, description in HEAD_SECTIONS:
        assert head.count(marker) == 1, f'Review head section marker: {marker}'
        head = head.replace(marker, f'\n<!-- {description} -->\n{marker}', 1)
    outputs['webflow/head.html'] = (
        '<!--\nSEFAS | HEAD CUSTOM CODE\n'
        'Paste this entire block into Webflow: Site settings > Custom code > Head code.\n'
        'Replace the previous head snippet to avoid loading duplicate integrations.\n'
        f'Custom assets are pinned to release {args.version}.\n-->\n' + head
    )

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
    assert len(tags) == len(FOOTER_SECTIONS), 'Review footer section comments.'
    outputs['webflow/footer.html'] = (
        '<!--\nSEFAS | FOOTER CUSTOM CODE\n'
        'Paste this entire block into Webflow: Site settings > Custom code > Footer code\n'
        '(before the closing body tag). Replace the previous footer snippet.\n'
        f'Custom assets are pinned to release {args.version}.\n\n'
        'Keep this script order. GSAP and ScrollTrigger must load before section 03.\n'
        'Only the Wistia player uses async; the other tags preserve execution order.\n'
        'Existing data-cmp-ab attributes are retained for the consent configuration.\n'
        '-->\n\n' + '\n\n'.join(
            f'<!-- {description} -->\n{tag}'
            for description, tag in zip(FOOTER_SECTIONS, tags)
        ) + '\n'
    )

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
