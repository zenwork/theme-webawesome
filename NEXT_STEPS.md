# Next Steps

Execution plan to align the theme with project goals:

- Lume technical docs theme
- WebAwesome (free) first
- Lit + web components (no large frameworks)
- easy injection of user Lit components
- optional WebAwesome Pro via config

## 1) Stabilize Baseline (P0)

- [x] Fix lint failures in demo pane styles/import usage.
- [x] Make `test/` integration build pass (currently missing `lit` and `prismjs` import-map entries in `test/deno.json`).
- [x] Ensure root and test builds succeed without warnings that indicate broken behavior.

Acceptance:

- `deno lint` passes in root.
- `deno task build` passes in root.
- `deno task build` passes in `test/`.

## 2) Add WebAwesome Runtime Configuration (P0)

- [x] Introduce a theme option for WebAwesome mode:
  - `free` (default)
  - `pro` (opt-in)
- [x] Introduce configurable asset base path/URL for WebAwesome loader and CSS.
- [x] Update base layout to read these values from site/theme data instead of hard-coded paths.

Acceptance:

- Default output uses free WebAwesome paths.
- Switching to Pro only requires config/data changes, not template rewrites.

## 3) Define Lit Component Extension Surface (P0)

- [x] Define a clear convention for user component entrypoints (for example: one generated bundle entry + user-provided imports list).
- [x] Expose configuration for additional component modules to include in the bundle.
- [x] Document required component registration pattern (`customElements.define(...)`).

Acceptance:

- A user can add a custom Lit component and render it in a `.vto` page with minimal setup.

## 4) Docs-Theme Experience (P1)

- [x] Expand the docs-focused layout primitives (navigation, content width, code-example sections).
- [x] Improve `demo-pane` for runnable examples:
  - better error/output handling
  - optional tabbed mode for small viewports
  - remove debug logging
- [x] Add at least 2 canonical demo pages showing snippet + rendered component behavior.

Acceptance:

- Theme clearly presents coding examples and runnable snippets as first-class content.

## 5) Authoring Documentation (P1)

- [x] Update `README.md` with:
  - quick start
  - free vs Pro configuration
  - how to inject custom Lit components
  - test-site workflow
- [x] Add a short “theme consumer checklist” to prevent common setup errors.

Acceptance:

- A new user can configure and extend the theme from README alone.

## Suggested Implementation Order

1. P0 baseline fixes
2. WebAwesome configuration surface
3. Lit component injection surface
4. Docs-theme UX improvements
5. README and final polish
