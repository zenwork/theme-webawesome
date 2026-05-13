# Documentation Backlog

This backlog tracks documentation work for the theme and maps directly to the current implementation.

## 1) Baseline correctness pass (P0) - Done

- [x] Fix incorrect defaults/examples in `README.md`
- [x] Fix invalid TypeScript snippets in `src/docs/getting-started/index.vto`
- [x] Align plugin wiring documentation with `plugins.ts` (`nav`, markdown `toc`, html heading TOC preprocessing)
- [x] Correct component entrypoint loading behavior docs (primary script auto-loaded, additional entrypoints built but
      not auto-injected by base layout)

## 2) Docs information architecture refresh (P1) - Done

- [x] Replace placeholder introduction content in `src/docs/introduction.md` with a real overview
- [x] Add a docs map page section that links setup, configuration, components, navigation/TOC, and extension docs
- [x] Make feature-discovery path obvious from the home page and docs sidebar

## 3) Component/API reference depth (P1) - Done

- [x] Add `demo-pane` prop reference with defaults, accepted values, and behavior notes
- [x] Add `code-example` prop reference (language, `code`, `line-numbers`, slot behavior)
- [x] Add `site-toc-tree` usage and persistence behavior (`storage-key`, expanded state)

## 4) Demonstration coverage (P1/P2) - Done

- [x] Add multiple runnable `demo-pane` recipes for common docs patterns
- [x] Add one non-editable `demo-pane` example using `layout="tabs"` for compact/mobile behavior
- [x] Add examples showing import auto-detection and explicit `imports`

## 5) Extension and integration guidance (P2) - Done

- [x] Add a focused guide for user-provided Lit components and entrypoint composition
- [x] Document recommended pattern for loading additional entrypoints (import from primary or custom layout injection)
- [x] Add a troubleshooting section for asset path mismatches and missing custom element registration

## 6) Documentation quality guardrails (P2) - Done

- [x] Add a short docs update checklist to `AGENTS.md` or contributor docs
- [x] Add a lightweight docs smoke page in `test/` that exercises key theme surfaces
- [x] Add a release check item ensuring docs reflect newly added options/components
