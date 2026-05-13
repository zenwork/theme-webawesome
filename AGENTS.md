# AGENTS.md

Guidance for coding agents working in this repository.

## Project Summary

- This repo is a **Lume theme project** built on **Deno**.
- Primary goal: build a **technical documentation theme** using the **WebAwesome** component library.
- Distribution goal: the theme should focus on the **free WebAwesome library** by default.
- Compatibility goal: using **WebAwesome Pro** should remain possible via project/user configuration.
- Core implementation library: **Lit** for authoring web components.
- Content focus: pages should emphasize **coding examples** and **runnable code snippets** (see `src/components/demo-pane/`).
- Architectural focus: prefer **web components** and keep the client stack lightweight; do **not** introduce large frontend frameworks.
- Extensibility goal: make it straightforward for theme users to inject and use their own **Lit-based web components**.
- It provides:
  - a site source under `src/`
  - plugin wiring in `plugins.ts`
  - theme export in `mod.ts`
  - a local test site under `test/`
- UI components are built with **Lit** and use **WebAwesome** components.

## Stack and Conventions

- Runtime/tooling: Deno (`deno.json` at repo root and `test/deno.json` for test site).
- Site generator: Lume (`lume/` imports from jsDelivr).
- Component code: TypeScript + Lit decorators (`experimentalDecorators` enabled).
- Formatting in `deno.json`:
  - single quotes
  - no semicolons
  - `lineWidth: 120`
  - `indentWidth: 2`

## Repo Map

- `_config.ts`: root site bootstrap (`lume({ src: './src' })` + `site.use(plugins())`).
- `plugins.ts`: plugin composition (`lightningcss`, `base_path`, `metas`, `sitemap`, `favicon`, `esbuild`).
- `mod.ts`: theme entrypoint consumed by other Lume sites (`site.remote("/", import.meta.resolve("./src"), ["/**/*"])`).
- `src/`: theme files, templates, CSS, and custom components.
- `src/components/`: Lit components and exports.
- `tools/npm.ts`: generates `package.json` dependencies from `deno.json` npm imports.
- `test/`: standalone Lume site that imports this theme via `theme/mod.ts`.

## Standard Commands

From repo root:

- `deno task serve` — run the theme site in dev mode.
- `deno task build` — build root site.
- `deno task lume upgrade` — update Lume deps.
- `deno task npm` — generate/update `package.json` from `deno.json` npm imports.
- `deno lint` / `deno fmt` — lint/format code.

From `test/`:

- `deno task serve` — run the theme integration test site.
- `deno task build` — build test site.

## Reference Docs

Primary framework/template docs for this repo:

- Lume docs home: https://lume.land/docs/
- Lume config (`_config.ts`): https://lume.land/docs/configuration/config-file/
- Lume data model (for `_data.yml`, page data): https://lume.land/docs/core/data-model/
- Lume components: https://lume.land/docs/core/components/
- Lume themes: https://lume.land/themes/

Vento docs (templates like `.vto`, e.g. `src/index.vto`):

- Vento home: https://vento.js.org/
- Vento syntax: https://vento.js.org/syntax/
- Vento include syntax: https://vento.js.org/syntax/include/
- Lume Vento plugin docs: https://lume.land/plugins/vento/

Lume plugins used in `plugins.ts`:

- Lightning CSS: https://lume.land/plugins/lightningcss/
- Base path: https://lume.land/plugins/base_path/
- Metas: https://lume.land/plugins/metas/
- Sitemap: https://lume.land/plugins/sitemap/
- Favicon: https://lume.land/plugins/favicon/
- ESBuild: https://lume.land/plugins/esbuild/

Related docs for this project:

- Lume CMS docs (`_cms.ts`): https://lume.land/cms/
- Lit docs (`src/components/**`): https://lit.dev/docs/
- WebAwesome docs (custom elements imported via `webawesome`): https://webawesome.com/docs/

## What To Verify After Changes

1. Run `deno fmt` and `deno lint`.
2. Run `deno task build` in root.
3. If theme behavior changed, run `deno task build` (or `serve`) in `test/` as well.
4. For component changes, verify rendering in pages that use `src/components/index.ts`.

## Editing Rules for Agents

- Keep changes scoped; do not refactor unrelated files.
- Do not introduce large frontend frameworks (for example React/Vue/Angular/Svelte) unless explicitly requested.
- Prefer standards-based web components and small utilities over framework-centric abstractions.
- For custom interactive UI, default to **Lit-based web components** to match existing project patterns.
- Preserve and improve extension points (component registration/import surfaces) so downstream users can plug in their own Lit components with minimal setup.
- Keep WebAwesome integration configuration-driven where possible, so free vs Pro consumption can be switched without structural rewrites.
- Preserve existing plugin order in `plugins.ts` unless the change explicitly requires it.
- If adding npm-based imports, ensure `deno.json` imports are updated and run `deno task npm`.
- Keep exports coherent:
  - component exports in `src/components/index.ts`
  - theme API in `mod.ts` / `plugins.ts`.
- Avoid committing generated `_site/` output unless explicitly requested.

## Release Notes Context

- Release automation uses `release-please` (`.github/workflows/release-please.yml` + `release-please-config.json`).
- Conventional commit types map to changelog sections (`feat`, `fix`, `refactor`, `test`, `chore`).
- `deno.json` is listed as an extra file for release version updates.

## Known Caveats

- `deno.json` currently has `lock: false`; do not assume lockfile enforcement.
- Remote imports use pinned versions from jsDelivr/npm specifiers; treat version bumps as explicit changes.
