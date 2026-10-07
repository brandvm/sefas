# SEFAS Webflow custom code

TypeScript + esbuild custom-code bundle for
`https://www.sefasinnovation.fr`, migrated from the behavior-identical
`v1.0.0` hosting release to the `brandvm/wf-template` architecture.

## Webflow installation

[`loader.html`](loader.html) contains the only three pieces pasted into
Webflow:

1. Site settings → Head code: vendor bootstraps and shared bundle config.
2. A global on-canvas Embed: one stylesheet link and environment selector.
3. Site settings → Footer code: one JavaScript bundle loader.

Replace the old fields and global Embed; do not append the new snippets to the
old code. Release `v1.0.0` remains an immutable rollback point. The new loader
pins production to `v2.0.0`.

Keep the existing GTM `<noscript>` body Embed. The replacement global Embed is
the one containing the Phosphor links and large style blocks; those assets now
come from `dist/styles.css`. Finsweet List remains in the compact Head section.

## Commands

```bash
corepack enable
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm test
```

`dist/` is committed. CI checks types, builds, runs the browser tests, confirms
that `dist/` matches `src/`, and publishes staging assets to GitHub Pages from
the `main` branch.

## Runtime structure

- `src/index.ts` isolates initializers so one failure does not block the rest.
- `src/modules/environment-switcher.ts` provides Dev/Staging selection only on
  the Webflow staging domain.
- `src/modules/lenis.ts` bundles the existing Lenis `1.1.5` integration.
- `src/modules/wistia-player.ts` loads the hosted Wistia player once.
- `src/legacy/` preserves the remaining tested `v1.0.0` behavior.
- `src/styles.css` contains the previous hosted CSS and global Embed CSS.

The Resources filter styling uses Finsweet's `.is-list-active` state instead
of Webflow's unsynchronized `.w--redirected-checked` visual class.

## Release and rollback

```bash
pnpm check
pnpm test
git tag v2.0.0
git push origin main
git push origin v2.0.0
```

After the tag and staging assets are available, paste all three sections from
`loader.html`, publish to Webflow staging, run the release checklist, and then
publish production. Roll back by reinstalling the `v1.0.0` snippets or by
setting the loader release to the previous tested tag.
