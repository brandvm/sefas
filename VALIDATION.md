# Release validation

## v2.0.0 — wf-template migration

Validated on 2026-10-07.

- `pnpm check` passes with TypeScript strict mode.
- `pnpm test` builds the committed distribution and passes 19 Chromium tests.
- Environment tests cover development/staging selection, production pinning,
  fallback behavior, keyboard/mobile use, blocked storage, duplicate loading,
  and prevention of accidental localhost requests.
- Resources filter regression tests confirm that Finsweet's
  `.is-list-active` state displays the active control even when Webflow's
  decorative state is absent, and that a stale Webflow checked class cannot
  display an inactive filter.
- Existing JavaScript behavior from `v1.0.0` remains in `src/legacy/` and is
  bundled in its original execution order. Lenis `1.1.5` is bundled directly;
  Wistia is loaded once by its initializer.
- Existing hosted CSS and the published global Embed styles were migrated into
  `src/styles.css`; Google Fonts and Phosphor Icons are loaded from that sheet.
- `v1.0.0` remains immutable for rollback. Webflow staging and real consent,
  slider, form, navigation and video behavior must still be checked after the
  three `loader.html` sections are installed and before production publish.

## v1.0.0 — hosting migration

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
