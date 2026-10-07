# Gotchas

A running log of things that cost time on this project. Agents read it at
the start of every session and add to it when they hit something new (see
the Session protocol in `AGENTS.md`). Never delete an entry — update its
`Status` instead.

Entries tagged `Scope: template-candidate` are harvested across all client
repos to improve `brandvm/wf-template`.

## Entry format

```md
### YYYY-MM-DD · Short title
- Area: designer | css | loader | release | mcp | ci | js | perf
- Scope: project | template-candidate
- Symptom: what was observed
- Cause: why it happened
- Fix: what was done, or the workaround
- Status: open | fixed <sha> | upstreamed wf-template <sha>
- Found by: claude | codex | human
```

## This project

<!-- Add new entries here, newest first. -->

### 2026-10-07 · Gated resource direct links are intentionally shareable
- Area: js
- Scope: project
- Symptom: Client-shared video links needed to reveal the resource without
  requiring recipients to submit the lead form.
- Cause: The existing page-specific form code only revealed the Webflow success
  state after submission and had no direct-link behavior.
- Fix: `?ungated=1` now reveals the existing success/video area on pages with
  `#wf-form-Gated-Form` without sending a Pardot request. This is convenience
  gating, not authorization; anyone with the URL can reuse or forward it.
- Status: fixed in v2.0.1
- Found by: human

### 2026-10-07 · Finsweet URL filter and Webflow checkbox states were inverted
- Area: css
- Scope: template-candidate
- Symptom: A query-string filter correctly filtered Resources, but its visual
  checkbox looked inactive; the first click removed the filter while making
  the decorative checkbox look active.
- Cause: Finsweet set the real input and `.is-list-active` correctly, while
  Webflow's decorative `.w--redirected-checked` class was not synchronized
  with programmatic URL initialization. Custom CSS styled the Webflow class.
- Fix: Style `.filter-radio.is-list-active` as the source of truth and force
  the decorative element inactive when the Finsweet wrapper is inactive.
- Status: fixed in v2.0.0
- Found by: codex

### 2026-10-07 · Migrated the hosting-only repository to wf-template
- Area: release
- Scope: project
- Symptom: Site code required separate generated assets plus large Head,
  Footer and Embed fields, without typed builds or browser regression tests.
- Cause: `v1.0.0` externalized inherited code but intentionally did not adopt
  the standard project toolchain.
- Fix: `v2.0.0` uses the three-piece loader, TypeScript/esbuild, committed
  dist assets, GitHub Pages staging and Playwright tests. The immutable
  `v1.0.0` tag remains the rollback point.
- Status: fixed in v2.0.0
- Found by: codex

### 2026-09-29 · Snippets on main differ from the v1.0.0 tag
- Area: release
- Scope: project
- Symptom: `webflow/head.html` and `webflow/footer.html` on `main` are not
  byte-identical to the same files at tag `v1.0.0`.
- Cause: 02c6cdb added numbered section comments after the tag; only HTML
  comments and whitespace changed, hosted assets did not, and the tag was
  not moved (VALIDATION.md).
- Fix: either version of the snippets is valid for v1.0.0. The next release
  tag will realign them.
- Status: documented
- Found by: human

### 2026-09-29 · Inline `defer` on the main module was inert
- Area: js
- Scope: template-candidate
- Symptom: The supplied footer had `defer` on an inline script, which
  browsers ignore.
- Cause: `defer` only applies to scripts with `src`. Keeping it when
  externalizing would have changed execution order.
- Fix: `tools/build.py` drops `defer` when it adds `src`, preserving parser
  order. Do not add `async`/`defer` to migrated scripts (README).
- Status: fixed 73cd7da
- Found by: human

### 2026-09-29 · `%%title%%` / `%%description%%` placeholders in Head code
- Area: loader
- Scope: project
- Symptom: The supplied head sets `<title>%%title%%</title>` and a matching
  description meta (`source/head.html`).
- Cause: Template placeholders from another CMS workflow, carried over
  unchanged.
- Fix: none yet — confirm with the user whether they belong; Webflow page
  SEO settings should provide the real title and description (README).
- Status: open
- Found by: human

### 2026-09-29 · Wistia / Iubenda consent integration is unverified
- Area: js
- Scope: project
- Symptom: The additional `wistia-privacy.js` block is preserved as
  supplied; the smoke test only confirmed it registers.
- Cause: Its consent purpose mapping and video API assumptions were never
  checked against the real Iubenda configuration (README, VALIDATION.md).
- Fix: test real video consent transitions on staging before production.
- Status: open
- Found by: human

### 2026-09-29 · Generator asserts fixed block counts
- Area: ci
- Scope: project
- Symptom: `tools/build.py` fails with "Review changed source styles" or
  "Review changed source scripts" after editing `source/`.
- Cause: It requires exactly 4 head `<style>` blocks and 7 inline footer
  scripts, mapped by position to `NAMES` and `FOOTER_SECTIONS`.
- Fix: edit inside existing blocks; adding/removing one needs matching
  updates to the counts and lists in `tools/build.py`.
- Status: documented
- Found by: human

### 2026-09-29 · Site CSS loads from Head code — invisible on the canvas
- Area: designer
- Scope: template-candidate
- Symptom: Styles from `site.css` (forms, focus, skip link, nav lists) do
  not appear in the Designer.
- Cause: The stylesheet `<link>` sits in Head code (`webflow/head.html`
  section 07); the Designer canvas does not render site custom code.
- Fix: check CSS on the published staging site; put new styling in the
  Designer. Moving the link to an Embed would change load order — ask first.
- Status: open
- Found by: human

## Known from previous projects

Inherited from `wf-template`; only the entries that apply to this
repo's architecture are copied. Found across earlier client repos; listed so
they are not rediscovered. Status refers to the template.

### 2026-10-02 · VER lives in two snippets and a placeholder 404s at launch
- Area: release
- Scope: template-candidate
- Symptom: Prod CSS and JS both 404 the moment a custom domain is attached.
- Cause: `VER = "X.Y.Z"` is never exercised on `*.webflow.io`, and a release
  must bump VER in both the Embed and the footer snippet.
- Fix: regenx keeps one `RELEASE` value in the head config (`null` until the
  first tag) that the other snippets read.
- Status: open
- Found by: human

### 2026-10-02 · CDN `defer` scripts cannot be ordered against the bundle
- Area: js
- Scope: template-candidate
- Symptom: Lenis, GSAP or Finsweet is undefined when a module runs.
- Cause: The footer loader appends the bundle dynamically (async), so a
  sibling `<script defer>` has no ordering promise.
- Fix: bundle libraries with `pnpm add`. Do not also load Webflow's own GSAP
  or jQuery a second time.
- Status: documented
- Found by: human
