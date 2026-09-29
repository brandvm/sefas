# Release v1.0.0 validation

Validated on 2026-09-29.

- Initial release Head code: **1,019 characters**.
- Initial release Footer code: **1,008 characters**.
- All seven extracted JavaScript files pass `node --check`.
- `python3 tools/build.py --check` verifies generated files against the supplied
  source, including the seven script bodies and four CSS blocks.
- Compared the supplied inline code with the externalized code in headless Chrome
  using a saved response from the Webflow staging homepage. Only the custom-code
  sections and the new CDN responses were substituted in that isolated browser;
  no Webflow settings were changed.
- All eight new assets loaded. Both variants reported zero uncaught JavaScript
  errors, and matched on Lenis initialization, exposed site modules, navigation
  list styling, the skip link's appearance and keyboard focus behavior, iframe
  titles, and registration of the supplied Wistia function and queue.

The subsequent snippet documentation update adds only HTML comments and spacing:
Head code is now **2,055 characters** and Footer code is **2,458 characters**.
Comparison with the initial snippets confirmed identical executable markup after
removing comments and inter-tag whitespace. The hosted assets are unchanged, and
the generator check still passes. The existing `v1.0.0` tag was not moved.

This smoke test does not validate every page or establish that the Wistia/Iubenda
consent integration controls analytics correctly. Publish the snippets to staging
and check real video consent transitions, sliders, forms, and navigation before
publishing the Webflow site to production.
