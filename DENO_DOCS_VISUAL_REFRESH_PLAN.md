# Deno Docs Visual Refresh Plan

This plan aligns the current `theme-webawesome` docs UI with the visual language of `https://docs.deno.com/runtime/`
while keeping the existing Lume + Lit + WebAwesome architecture.

## 1) Reference Snapshot (What We’re Matching)

Based on the provided screenshots and live Deno docs runtime page, key visual traits are:

- Dense, product-style docs shell: sticky top header + left nav + content + right page TOC.
- Very restrained neutral palette with one bright accent color for active states.
- Flat surfaces and divider lines (not “card-heavy” sections).
- Compact typography rhythm; high scannability.
- Prominent utility header controls (section nav, search input, theme toggle).
- Consistent light/dark parity (same structure, different neutral ramps).

## 2) Current Theme Gap Analysis

Current implementation strengths:

- Already has the correct macro layout structure (`header`, left sidebar, content, right TOC).
- Already supports theme toggle, sticky behavior, and TOC syncing.
- Already has reusable docs components (`code-example`, `demo-pane`, `site-toc-tree`).

Primary visual gaps vs Deno docs:

1. Surfaces are too “card-like” (rounded boxed panels for left/right rails).
2. Header is functionally minimal (no search field, weak top-nav visual hierarchy).
3. Left nav styling is less dense/structured (missing Deno-like list rhythm and active treatment).
4. Typography and spacing are more generic and airy than Deno’s compact technical docs rhythm.
5. Accent and neutral token system does not mirror Deno-like ramps by default.
6. Code/demo panels feel design-wise separate from the page shell.

## 3) Constraints and Compatibility

- Keep WebAwesome free mode as default.
- Keep Pro mode and custom token overrides fully supported.
- Avoid introducing heavyweight frameworks.
- Preserve extension points for downstream Lit components.
- Keep existing navigation/Toc data flow in `plugins.ts`.
- Use WebAwesome components and theming APIs as the primary styling mechanism.
- Keep bespoke CSS focused on structural layout only (grid, sticky, responsive placement), not visual skinning.
- Do not introduce any additional styling library or toolkit (for example Tailwind, Bootstrap, utility CSS engines,
  CSS-in-JS runtimes).

### WebAwesome-First Theming Rules

- Prefer WebAwesome component APIs (`variant`, `appearance`, `size`, states, and `::part`) over custom class styling.
- Prefer WebAwesome design tokens/CSS variables for color, typography, radius, border, and interactive states.
- Avoid introducing hard-coded visual values when a WebAwesome token exists.
- Keep user-land customization centralized through WebAwesome token files (for example via
  `webawesome.customPropertiesCssPath`), not scattered theme-specific classes.
- Any new visual option should map to token/config surfaces users can override downstream.
- Do not add new styling build tooling or styling runtime dependencies for this refresh.

## 4) Review Inputs (Priority Signals)

These are explicit design requirements from review feedback:

- Use vertical divider lines to compartmentalize columns and align structures.
- Use lighter/desaturated menu colors so the core reading column carries emphasis.
- Keep navigation selection states sharp and unambiguous (section, item, hover).
- Add “copy page as markdown” capability.
- Split top-level navigation into separate menus/groups instead of one giant tree.
- On narrow screens, move “On this page” to the top of content instead of a right-side rail.
- Make content width fluid across screen sizes: never full width, but better use of very wide displays.

## 5) Implementation Plan (Phased)

### Phase 0 — Baseline Capture

**Goal:** avoid subjective regressions while iterating.

- Capture before screenshots for:
  - root index
  - long-form docs page with page TOC
  - component page (`code-example`, `demo-pane`)
  - dark mode equivalents
- Record current spacing/tokens in a short “before” note.

### Phase 1 — Design Tokens (Deno-like Theme Preset)

**Goal:** establish the color/typography foundation first.

- Introduce a default token preset (light + dark) inspired by Deno’s neutrals and runtime accent.
- Keep it override-friendly through existing `customPropertiesCssPath`.
- Move as much visual styling as possible into WebAwesome token overrides rather than bespoke selectors.
- Normalize core constants:
  - neutral text/background ramps
  - border contrast
  - accent for active nav/highlight links
  - border radii (small, subtle)

**Likely files:**

- [`src/style.css`](/Users/flo/dev/zenwork/theme-webawesome/src/style.css)
- `src/_includes/css/` (new preset file if separated)
- docs example token file updates under `src/docs/configuration/` and `test/styles/`

### Phase 2 — Shell Layout Restyle (Header + 3 Columns)

**Goal:** make the frame feel like Deno docs before tuning internals.

- Convert left/right panels from card shells to flat rails with vertical dividers.
- Make vertical divider lines a first-class layout primitive for header/content rail alignment.
- Tighten top header height, spacing, and tab-like section nav treatment.
- Keep existing sticky behavior, but align offsets and column widths to Deno-like proportions.
- Replace fixed shell widths with fluid constraints so layout scales smoothly on large displays.
- Add optional search field region in header (can be “visual shell only” first, wired later).
- On narrow screens, render page TOC near the top of the article flow (under page heading/action row) instead of as a
  side panel.
- Where header/sidebar controls are WebAwesome elements, prioritize WA props/tokens before adding new CSS hooks.

**Likely files:**

- [`src/_includes/layouts/base.vto`](/Users/flo/dev/zenwork/theme-webawesome/src/_includes/layouts/base.vto)
- [`src/style.css`](/Users/flo/dev/zenwork/theme-webawesome/src/style.css)

### Phase 3 — Navigation Styling (Left Sidebar + Right Page TOC)

**Goal:** match scan rhythm and active-state behavior.

- Left sidebar:
  - uppercase section labels
  - lighter/desaturated text for non-active navigation rows
  - denser row height
  - subtle left border for hierarchy
  - active row highlight using accent tint + stronger border/contrast
- Right TOC:
  - simplified list treatment
  - muted default text, stronger active state
  - compact spacing to reduce visual noise
- Top-level grouping:
  - present section groups as distinct menus with their own headings
  - avoid one monolithic tree presentation in the primary sidebar

**Likely files:**

- [`src/_includes/section-toc.vto`](/Users/flo/dev/zenwork/theme-webawesome/src/_includes/section-toc.vto)
- [`src/style.css`](/Users/flo/dev/zenwork/theme-webawesome/src/style.css)
- [`src/components/site-toc-tree.ts`](/Users/flo/dev/zenwork/theme-webawesome/src/components/site-toc-tree.ts) (only if
  behavior hooks need minor updates)

### Phase 4 — Content Typography and Rhythm

**Goal:** Deno-like reading cadence in the main article column.

- Tune heading scale/weight/spacing (`h1`, `h2`, `h3`).
- Tighten paragraph and list spacing for technical docs density.
- Use fluid reading width constraints:
  - keep current narrow-screen behavior intact
  - avoid full-width text lines
  - expand main text column on large screens (for example toward ~80–90ch, depending on final visual balance)
- Improve inline code and link contrast in both themes.

**Likely files:**

- [`src/style.css`](/Users/flo/dev/zenwork/theme-webawesome/src/style.css)

### Phase 5 — Code Surfaces (`code-example` + `demo-pane`)

**Goal:** unify code block visuals with the docs shell.

- Align border radius, border color, background layering, and copy controls.
- Make code blocks feel native to the refreshed shell (not separate widgets).
- Tune dark-mode contrast to match Deno-like code readability.
- Replace hard-coded component visual values with WebAwesome token references wherever possible.

**Likely files:**

- [`src/components/code-example.ts`](/Users/flo/dev/zenwork/theme-webawesome/src/components/code-example.ts)
- [`src/components/demo-pane/styles.ts`](/Users/flo/dev/zenwork/theme-webawesome/src/components/demo-pane/styles.ts)

### Phase 6 — Optional “Deno-like” Header Enhancements

**Goal:** close the remaining visual/function gap without hard-coupling to Deno branding.

- Add optional logo slot/asset path in config (brand-agnostic).
- Add optional header search integration:
  - minimal mode: UI-only search field
  - full mode: plugin-backed client search (keyboard shortcut and results panel)
- Add “copy page as markdown” action in the content header:
  - expose as a small utility control near page-level actions
  - source markdown URL from page metadata/front matter or generated mapping
  - fallback behavior when markdown source is unavailable
- Keep this opt-in to avoid forcing complexity on all theme users.

**Likely files:**

- [`plugins.ts`](/Users/flo/dev/zenwork/theme-webawesome/plugins.ts) (new options)
- [`src/_includes/layouts/base.vto`](/Users/flo/dev/zenwork/theme-webawesome/src/_includes/layouts/base.vto)
- docs pages in `src/docs/configuration/`

### Phase 7 — Docs + Integration Test Site Updates

**Goal:** keep theme docs truthful and showcase new visuals/options.

- Update docs for new defaults/options.
- Add/adjust test-site pages showing:
  - refreshed shell in light/dark
  - new header/search behavior (if enabled)
  - updated code and demo components

**Likely files:**

- `src/docs/**/*`
- `test/**/*`

## 6) Acceptance Criteria

1. Visual structure clearly resembles Deno docs in both light and dark.
2. Header + left nav + content + right TOC remain stable across target breakpoints.
3. Vertical divider lines provide clear, consistent column alignment cues.
4. Sidebar/default nav colors remain desaturated relative to the reading column.
5. Navigation active and hover states are clearly identifiable at a glance.
6. Top-level navigation is grouped into separate menus/sections, not one giant tree.
7. On narrow screens, “On this page” is shown near the top of content and remains usable.
8. Main content width scales fluidly with viewport size and never becomes full-width text.
9. No regressions in TOC behavior (selection, expansion persistence, heading scroll sync).
10. `code-example` and `demo-pane` remain functional and visually integrated.
11. Visual skinning is primarily token-driven through WebAwesome theming surfaces.
12. Bespoke CSS additions are limited to structural layout behavior, not duplicated color/theme systems.
13. No new styling library/toolkit or styling runtime/build dependency is introduced.
14. Theme remains configurable for non-Deno branding and WebAwesome Pro paths.
15. `deno fmt`, `deno lint`, root `deno task build`, and `test/deno task build` pass.

## 7) Recommended Execution Order

1. Phase 1 + 2 first (highest visual impact).
2. Phase 3 next (navigation grouping + state clarity).
3. Phase 4 + 5 next (content and component polish).
4. Phase 6 after shell/nav are stable.
5. Phase 7 always at the end with validation.

## 8) Risks and Mitigations

- Risk: overfitting to Deno branding.
  - Mitigation: implement brand-agnostic tokens/options; keep Deno look as default preset, not hardcoded identity.
- Risk: reduced flexibility for downstream users.
  - Mitigation: every new visual behavior should be token/config-driven.
- Risk: regressions in responsive nav interactions.
  - Mitigation: test drawer + sticky offsets + TOC sync after each phase, not only at the end.
