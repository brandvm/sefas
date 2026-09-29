# SEFAS Webflow custom code

JavaScript and CSS supplied for SEFAS, served from this public repository through
jsDelivr. The Webflow fields reference release `v1.0.0`.

The snippets on `main` include numbered comments explaining each integration,
installation location, and script loading order. With comments, Head code is
2,055 characters and Footer code is 2,458 characters. The hosted JavaScript and
CSS still use the unchanged `v1.0.0` release.

## Install in Webflow

1. Replace the **Head code** field with the complete contents of
   [`webflow/head.html`](webflow/head.html).
2. Replace the **Footer code / Before </body>** field with the complete contents of
   [`webflow/footer.html`](webflow/footer.html).
3. Save and publish to the Webflow staging domain first. Check navigation, sliders,
   the request-demo panel, forms, keyboard skip link, and video consent behavior.
4. Publish to the production domain after those checks.

Replace the supplied code rather than appending these snippets: running both
versions would initialize the same handlers twice. The extra Wistia privacy
script from the handoff is already included as the last footer script.

The repository upload does not change or publish Webflow site settings.

## Files and loading order

| File | Purpose |
| --- | --- |
| `assets/css/site.css` | All four supplied head styles, in their original order |
| `assets/js/lenis-init.js` | Existing Lenis and GSAP integration |
| `assets/js/request-demo.js` | Open the demo panel from the URL hash |
| `assets/js/site-modules.js` | Sliders, navigation, styled text, and button behavior |
| `assets/js/accessibility.js` | Existing accessibility and French text adjustments |
| `assets/js/iubenda-semantics.js` | Existing consent button markup repair |
| `assets/js/frame-titles.js` | Existing iframe titles |
| `assets/js/wistia-privacy.js` | Supplied additional Wistia consent script |

The external Wistia and Lenis library tags remain in the footer. Iubenda, Google
Tag Manager, Typekit, fonts, and metadata remain in the head. Existing script IDs
and consent attributes are retained. The former navigation-style ID is retained
on the CSS link.

Scripts remain separate classic scripts in their original sequence. The original
inline `defer` attribute on the main module was ineffective and is omitted on its
external replacement to preserve execution order. Do not add `async` or `defer`
to the migrated scripts without reviewing page-specific dependencies.

## Existing behavior retained

This is a hosting migration, not a rewrite of the supplied code. JavaScript bodies
are unchanged; comments and ordinary whitespace are retained. Existing external
library versions are unchanged. Webflow must still load GSAP and ScrollTrigger
before the footer, as the original Lenis initializer requires them.

The supplied `%%title%%` and `%%description%%` placeholders remain unchanged.
Webflow page SEO settings should provide the actual page title and description;
confirm whether these template placeholders belong in this site's custom code.

The additional Wistia script is preserved as supplied. Its comments, consent
purpose mapping, callbacks, and video API assumptions are not a verification that
analytics follows the consent choice. Check this integration with the actual
Iubenda configuration and Wistia player on staging before production publication.

## Edit, validate, and release

The `source/` directory holds the supplied HTML fields, including the appended
Wistia block. Edit those source files, then generate the external assets and
replacement fields with Python 3 and Node.js:

```sh
python3 tools/build.py --version v1.0.1
python3 tools/build.py --version v1.0.1 --check
```

Commit the outputs, create a new release tag, and push the commit and tag. Verify
the new jsDelivr URLs before replacing the version in Webflow. Never move an
existing release tag: jsDelivr caches exact versions permanently. An older
version can be restored by pasting that release's snippets.

No npm installation or build service is required to serve these files.
