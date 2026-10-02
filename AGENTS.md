# SEFAS — Webflow custom code

Agent instructions for this repository. Codex, Cursor and similar tools read
this file directly; Claude Code reads it through `CLAUDE.md`. It is the single
source of agent rules — edit this file, never a copy of it.

This is a **hosting migration of inherited code**, not a project built from
`brandvm/wf-template`. The supplied Webflow Head and Footer fields were
externalized, unchanged, into files served from pinned jsDelivr tags. There
is no bundler, no npm install, no loader and no staging bundle — only a
Python generator.

## Project facts

- Client / site: SEFAS
- GitHub: `brandvm/sefas`, default branch `main`
- Webflow site ID: `6a6b877f2665785581430d2b` (inferred from the Webflow
  asset CDN path in `assets/js/site-modules.js`; verify)
- Staging site: unknown — fill in (README refers to "the Webflow staging
  domain" without naming it)
- Assets (production, pinned): `https://cdn.jsdelivr.net/gh/brandvm/sefas@v1.0.0/`
  → `assets/css/site.css` and seven `assets/js/*.js` files
- Production domain: unknown — fill in
- Production release: `v1.0.0`
- Third parties in the snippets: Iubenda, GTM `GTM-NQHZR3VG`, Adobe Fonts
  (Typekit), Google Fonts (Raleway), Wistia, Lenis 1.1.5 from unpkg. Webflow
  supplies GSAP and ScrollTrigger.

## Who owns what

Webflow owns markup, layout, classes, components, CMS content, interactions
**and styling by default**. This repo owns JavaScript behaviour and only the
CSS the Designer cannot express.

That split is deliberate. Repo CSS loads from Head code after `webflow.css`,
so it wins every specificity tie against the Designer. Any rule written here
that the Designer could have expressed becomes a hidden override: the next
person changes that style in the Designer, nothing happens, and the only fix
is edit `source/` → regenerate → tag a release → re-paste the snippets →
publish. Every project has lost time to that loop.

## CSS policy — Designer first

Before writing any CSS, decide where it belongs.

1. **Can the Designer do it?** A class or combo class style, a variable, a
   breakpoint style, a state (hover/focus/current), an interaction. If yes:
   - With the Webflow MCP connected, apply it in Webflow (styles and
     variables tools), then tell the user what was changed.
   - Without the MCP, give the user exact Designer steps: class, breakpoint,
     property, value.
   - Do **not** add it to the `<style>` blocks in `source/head.html` (which
     generate `assets/css/site.css`).
2. **Repo CSS needs a reason.** Every rule — or the section header comment
   covering a group of rules — carries one tag from this list:

   ```css
   /* repo-css: <tag> — <short why> */
   ```

   | Tag | Use for |
   | --- | --- |
   | `js-state` | Classes/attributes a module toggles (`.is-open`, `.is-loading`, `[data-state]`) |
   | `designer-cant` | Name the feature: `:has()`, complex combinators, `@keyframes`, `@supports`, container queries, `::marker`, `color-mix()`, masks |
   | `third-party` | Swiper, Lenis, Finsweet or other library markup |
   | `canvas-preview` | `.w-editor`, `.wf-design-mode`, `html:not([data-wf-domain])` helpers |
   | `approved-base` | A site-wide base the user explicitly asked to keep in code |
   | `override-webflow` | Overriding a `.w-*` default or a Designer style |

3. **`override-webflow` needs the user's explicit approval** and a
   `GOTCHAS.md` entry explaining why. Ask before writing it.
4. **Never, without that approval:** set `font-size` on `:root`/`html`,
   neutralize `.w-*` defaults, or reference Webflow variable names
   (`--_layout---…`, `--_typography---…`). A renamed variable in Webflow
   silently breaks every rule that reads it — Webflow rewrites its own
   references, never this repo's.
5. **Ambiguous request?** Say which parts go in the Designer and which go in
   code before editing anything. "Make the heading bigger on mobile" is a
   Designer breakpoint style, not a media query here.

Existing rules predate this policy and are untagged; add a `repo-css` tag to
any rule you touch, and question rules the Designer could own. (Most
inherited rules style the embedded third-party form markup —
`form.form …` — plus focus, contrast, skip-link and navigation-list fixes.)

## Inherited code stays behaviour-identical

All CSS and JS here is inherited code, and the migration's guarantee is
that it runs exactly as supplied. Unless the user asks otherwise:

- JavaScript bodies stay byte-identical to the blocks in
  `source/footer.html`; the four CSS blocks stay identical to the
  `<style>` blocks in `source/head.html`. `tools/build.py --check` enforces
  this — never edit `assets/` or `webflow/` by hand.
- No refactors, reformatting, minification, rule reordering, library
  upgrades (Lenis, Wistia, Iubenda, Typekit) or "cleanups" mixed into
  another change. Propose them separately.
- Keep script order, script IDs, `data-cmp-ab` consent attributes and the
  `sefas-semantic-nav-list-style` link ID. Do not add `async` or `defer` to
  migrated scripts.
- Keep the `%%title%%` / `%%description%%` placeholders unless the user
  decides otherwise (see `GOTCHAS.md`).

## Architecture

- `source/head.html`, `source/footer.html` — the supplied Webflow fields
  (plus the appended Wistia privacy block). **This is where code is
  edited.**
- `tools/build.py` (Python 3; uses `node --check` on each JS file):
  - extracts exactly **4** `<style>` blocks from the head into
    `assets/css/site.css` and replaces them with one pinned `<link>`;
  - extracts exactly **7** inline footer scripts, in order, into
    `assets/js/<NAMES[i]>.js` (`lenis-init`, `request-demo`, `site-modules`,
    `accessibility`, `iubenda-semantics`, `frame-titles`, `wistia-privacy`)
    and replaces each with a pinned `<script src>`, dropping the inert
    inline `defer`;
  - writes `webflow/head.html` and `webflow/footer.html` with numbered
    section comments (`HEAD_SECTIONS` / `FOOTER_SECTIONS`) and asserts each
    field stays under Webflow's 50,000-character limit.
- Adding or removing a style block or inline script means updating the
  counts, `NAMES` and the section lists in `tools/build.py` — the asserts
  fail otherwise. Do that only on request.
- `VALIDATION.md` records how v1.0.0 was validated. Update it for a release.

## Where code loads in Webflow (drives the Designer workflow)

| Snippet | Webflow location | Contents |
| --- | --- | --- |
| `webflow/head.html` | Site settings → Custom code → Head | Iubenda, GTM, Typekit, metadata, Google Fonts, theme-color, `<link>` to `site.css` |
| `webflow/footer.html` | Site settings → Custom code → Footer | Wistia, Lenis, then the seven pinned scripts in order |

- CSS loads from **Head code, so none of it is visible on the Designer
  canvas** (custom code is not rendered there). Check CSS on the published
  staging site. This is another reason to put styling in the Designer.
- **The Designer canvas never runs scripts.** No live reload; reload the
  Designer tab after publishing.
- GSAP and ScrollTrigger (Webflow) must load before footer section 03.

## Snippets are not versioned

A push or tag changes nothing on the site. The release tag is pinned in
**both** snippets; a release means replacing the whole Head and Footer
fields in Webflow (never appending — handlers would initialize twice) and
publishing. Say so in the commit message, and keep `webflow/` identical to
what is installed.

## Commands and release

```sh
python3 tools/build.py --version vX.Y.Z          # regenerate assets/ and webflow/
python3 tools/build.py --version vX.Y.Z --check  # verify generated files match source/
```

`--version` defaults to `v1.0.0`; always pass the release being prepared
(or the current one when only checking). There is no CI — run `--check`
yourself before every push.

Release exactly as the README describes: edit `source/`, generate with the
new version, commit the outputs, create and push a new tag, verify the new
jsDelivr URLs, then replace both Webflow fields, publish to staging, check
navigation, sliders, the request-demo panel, forms, the skip link and video
consent, then publish to production. Never move a pushed tag — jsDelivr
caches exact versions permanently. Never use `@latest`, `@main` or a branch
URL in production. Roll back by pasting an older release's snippets.

## Webflow MCP limits

Worked around, not fixed — do not rediscover these.

- `custom_value` is rejected for Color and Size variables (`color-mix()`,
  `oklch()`, `calc()`). Create those through the variables JSON import with
  `valueType: "custom"`.
- No variable rename or reorder within a collection. Rename in the Designer
  (preserves ids and aliases; recreating does not).
- The WHTML importer drops `class` attributes. Create the style, then apply
  it.
- `get_all_elements` does not descend into component definitions — pass the
  component scope. An element "missing" from a page is usually inside one.
- Concurrent Designer edits change element ids. Re-query on "Element not
  found" instead of assuming deletion.
- Responsive styles are only returned when breakpoints are requested
  explicitly (`include_breakpoints`).

## Session protocol

1. **Start:** read `GOTCHAS.md`. Do not repeat a mistake already logged.
2. **During:** when something surprising costs time — a Webflow quirk, an
   inherited-code trap, an MCP limitation, a fix that had to be reverted —
   add an entry to `GOTCHAS.md` in the same commit as the fix, using the
   format at the top of that file.
3. **Scope:** tag an entry `template-candidate` when it would recur on other
   client projects (including those built from `wf-template`); those entries
   are collected later to improve the template. Otherwise tag it `project`.
4. Never delete entries. Update `Status` when something is fixed or
   upstreamed.
