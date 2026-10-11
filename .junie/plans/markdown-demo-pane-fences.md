# Markdown Demo Pane Fences Specification And Plan

## Goal

Add a Markdown authoring format that converts one `json` fence plus one `html` fence into a `<demo-pane>`.

The second fence must be HTML source that is valid for the existing `demo-pane` Lit template renderer. It may contain
`${...}` interpolation expressions and Lit-style bindings such as `.prop=${...}`, `?attr=${...}`, and `@event=${...}`.

## Proposed Markdown Syntax

Use an HTML comment immediately before two adjacent fenced code blocks:

````md
<!-- demo-pane imports="button,badge" default-tab="output" editor-open -->

```json
{
  "label": "Deploy",
  "variant": "brand"
}
```

```html
<wa-button variant="${variant}">
  ${label}
</wa-button>
```
````

The rendered HTML should become:

```html
<demo-pane
  data='{"label":"Deploy","variant":"brand"}'
  template='<wa-button variant="${variant}">${label}</wa-button>'
  imports='["button","badge"]'
  default-tab="output"
  editor-open
></demo-pane>
```

## Authoring Rules

- [x] A group starts with an HTML comment whose trimmed content begins with `demo-pane`.
- [x] The comment must be immediately followed by two Markdown fences, allowing only whitespace between the comment and
      the first fence and between the two fences.
- [x] The first fence must be labeled `json`.
- [x] The first fence content must parse as a JSON object, because `demo-pane` expects object data.
- [x] The second fence must be labeled `html`.
- [x] The second fence content is passed to the `template` attribute as Lit template source.
- [x] The second fence may contain `${...}` interpolation expressions.
- [x] The second fence may contain Lit binding syntax, including `.prop=${...}`, `?attr=${...}`, and `@event=${...}`.
- [x] The preprocessor must not evaluate template expressions during build. Runtime rendering stays inside `demo-pane`.
- [x] If the group is invalid, incomplete, or unsupported, leave the original Markdown-rendered HTML unchanged.

## Comment Options

Supported boolean options:

- [x] `editor-open`
- [x] `fit-content`
- [x] `fill-height`
- [x] `readonly`

Supported string options:

- [x] `imports`
- [x] `default-tab`
- [x] `layout`
- [x] `editable`
- [x] `data-label`
- [x] `template-label`
- [x] `output-background`

Option behavior:

- [x] `imports="button,badge"` should normalize to `imports='["button","badge"]'`.
- [x] `imports='["button","badge"]'` should be preserved as a JSON array string after validation.
- [x] `default-tab` must be one of `data`, `markup`, or `output`.
- [x] `layout` must be one of `horizontal` or `tabs`.
- [x] Unknown comment options should be ignored, not emitted.
- [x] Invalid known option values should leave the group unchanged unless there is a strong reason to silently drop only
      that option.

## Conversion Rules

- [x] Run after Markdown has rendered to HTML, in the existing Lume `site.process(['.html'], ...)` stage.
- [x] Match this rendered shape:

```html
<!-- demo-pane ... -->
<pre><code class="language-json">...</code></pre>
<pre><code class="language-html">...</code></pre>
```

- [x] Decode HTML entities from both code blocks before validating JSON or assigning component attributes.
- [x] Compact or preserve the JSON object consistently before writing the `data` attribute.
- [x] Preserve the HTML template source content, including `${...}` expressions and Lit binding syntax.
- [x] Escape `data`, `template`, and string option values safely for HTML attributes.
- [x] Remove the `demo-pane` comment when conversion succeeds.
- [x] Preserve the comment and code fences unchanged when conversion fails.

## Lit Template Constraints

The preprocessor should not execute Lit template expressions at build time.

Template compliance is defined as "source acceptable to `demo-pane`'s runtime renderer":

- [x] HTML-like markup with optional `${...}` interpolation.
- [x] Optional Lit binding prefixes on attributes: `.`, `?`, and `@`.
- [x] Runtime sanitization still rejects disallowed content such as `<script>`, `<style>`, `<iframe>`, `<object>`,
      `<embed>`, `<form>`, inline `on*=` attributes, and `javascript:` URLs.

Implementation note: if build-time validation is added later, extract a server-safe validation helper rather than
importing browser-focused component modules directly into `plugins.ts`.

## Implementation Plan

- [x] Add a pure helper module such as `src/markdown-demo-panes.ts`.
- [x] Add parser helpers for:
  - [x] `demo-pane` option comments.
  - [x] rendered Markdown code block attributes.
  - [x] HTML entity decoding.
  - [x] safe HTML attribute escaping.
- [x] Add `convertMarkdownDemoPaneFences(content: string): string`.
- [x] Invoke `convertMarkdownDemoPaneFences` from the existing post-render HTML processor.
- [x] Run demo-pane conversion before single `code-example` fence conversion so grouped fences are not consumed
      individually.
- [x] Add an option under `Options`, for example `demoPanes?: { markdownFences?: boolean }`.
- [x] Default the option to enabled if this should be theme behavior by default.
- [x] Preserve an opt-out for users who need normal Markdown fence output.

## Tests

- [x] Converts `demo-pane` comment + `json` fence + `html` fence to `<demo-pane>`.
- [x] Allows Lit interpolation in the `html` fence.
- [x] Allows Lit `.prop`, `?attr`, and `@event` binding syntax in the `html` fence.
- [x] Normalizes `imports="button,badge"` to `imports='["button","badge"]'`.
- [x] Preserves valid `imports='["button","badge"]'`.
- [x] Emits supported boolean attributes.
- [x] Emits supported string attributes.
- [x] Leaves invalid JSON unchanged.
- [x] Leaves non-object JSON unchanged.
- [x] Leaves a group with a non-`html` second fence unchanged.
- [x] Leaves a group missing the second fence unchanged.
- [x] Leaves unsupported or malformed option values unchanged.
- [x] Confirms grouped fences are not also converted into separate `<code-example>` blocks.

## Docs And Examples

- [x] Add a test-site demo to `test/reference/markdown-code-fences.md`.
- [x] Add a smoke page or smoke section under `test/docs/smoke/`.
- [x] Update `src/docs/components/index.vto` with the Markdown authoring format.
- [x] Update `src/docs/configuration/index.vto` with the opt-out option.
- [x] Update `README.md`.

## Verification

- [x] Run `deno fmt`.
- [x] Run `deno lint`.
- [x] Run `deno task test:unit`.
- [x] Run `deno task build` from the repo root.
- [x] Run `deno task build` from `test/`.
- [x] Inspect generated HTML for the test-site demo and confirm:
  - [x] The grouped fences produce one `<demo-pane>`.
  - [x] The generated `template` attribute preserves `${...}` expressions.
  - [x] The original `demo-pane` comment is removed only on successful conversion.
  - [x] Invalid or unsupported groups remain unchanged.
