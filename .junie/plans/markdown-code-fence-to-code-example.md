# Markdown Code Fence To Code Example Preprocessor Plan

## Goal

Convert Markdown fenced code blocks rendered from triple backticks into the theme's code display component when the
fence language is supported by `code-example`.

Component naming note: the current component is `<code-example>` in `src/components/code-example.ts`. Confirm whether
`example-code` in the request is intended as a rename/alias before implementing a different element name.

## Current Findings

- [x] `code-example` currently supports `json`, `html`, `javascript`, `typescript`, `jsx`, `tsx`, `css`, and `text`.
- [x] Existing language aliases include `js`, `ts`, `tsx`, `jsx`, `markup`, `plaintext`, `txt`, and direct language
      names.
- [x] `plugins.ts` already has a Lume `site.preprocess(['.html'], ...)` pass for heading IDs, page TOC, and theme
      navigation.
- [x] Do not import `src/components/code-example.ts` directly into `plugins.ts`; it is a browser component module and
      registers a custom element.

## Implementation Checklist

- [x] Extract supported language metadata into a server-safe helper module.
  - [x] Create a small module such as `src/components/code-example-language.ts`.
  - [x] Move or mirror `codeExampleLanguages`, `CodeExampleLanguage`, language aliases, and `normalizeLanguage` there.
  - [x] Update `src/components/code-example.ts` to import the shared helper without changing component behavior.

- [x] Add a Markdown fence conversion option to the theme API.
  - [x] Add an option under `Options`, for example `codeExamples?: { markdownFences?: boolean }`.
  - [x] Default the option to enabled if the desired theme behavior is automatic conversion.
  - [x] Preserve an opt-out for users who need raw Markdown-generated `<pre><code>` output.

- [x] Implement the Lume processor.
  - [x] Run after Markdown has become HTML, targeting `.html` pages.
  - [x] Find Markdown-generated blocks shaped like `<pre><code class="language-*">...</code></pre>`.
  - [x] Normalize the language hint through the shared `normalizeLanguage` helper.
  - [x] Convert only supported languages to `<code-example language="...">...</code-example>`.
  - [x] Leave unsupported language fences unchanged.
  - [x] Preserve code text exactly after HTML entity decoding/encoding rules are defined.
  - [x] Preserve surrounding attributes only if there is a clear compatibility requirement; otherwise keep output
        minimal.

- [x] Choose a safe parsing strategy.
  - [x] Evaluate an HTML parser or DOM-style transform available in the Lume/Deno stack before using text replacement.
  - [x] If a parser is not practical, constrain any regex to complete `<pre><code ...>...</code></pre>` blocks and add
        tests for tricky content.
  - [x] Ensure nested HTML-looking code, JSX/TSX, quotes, template expressions, and escaped entities survive conversion.

- [x] Handle component rendering behavior.
  - [x] Use slotted text content when possible so `code-example` can keep its existing normalization path.
  - [x] Consider adding `padded` only if the visual output needs the same blank-edge behavior as existing docs examples.
  - [x] Confirm line-number defaults are acceptable for converted Markdown fences.
  - [x] Support `padded` and `no-line-numbers` through an immediately preceding
        `<!-- code-example padded no-line-numbers -->` comment.

## Tests

- [x] Add unit coverage for the shared language helper.
- [x] Add preprocessor tests or focused plugin tests for:
  - [x] `` ```ts `` converts to `<code-example language="typescript">`.
  - [x] `` ```tsx `` converts and preserves JSX-like content.
  - [x] `` ```json `` converts and preserves quotes/entities.
  - [x] `` ```bash `` or another unsupported language remains a normal code block.
  - [x] An unlabeled fence either remains unchanged or maps to `text`, depending on the chosen behavior.
  - [x] Existing hand-authored `<code-example>` blocks are not modified.
  - [x] A `code-example` comment before a supported fence passes `padded` and `no-line-numbers`.
  - [x] A `code-example` comment before an unsupported fence is preserved with the original code block.

## Docs And Examples

- [x] Update the relevant docs page under `src/docs/` to describe Markdown fence conversion and the supported languages.
- [x] Add at least one concrete usage to the `test/` integration site.
- [x] Add a dedicated test-site demo page or section that shows Markdown triple-backtick fences being converted to
      `<code-example>`.
- [x] Demo comment-driven `padded` and `no-line-numbers` attributes in the test site.
- [x] Add or update a smoke page under `test/docs/smoke/` if this affects key rendering surfaces.
- [x] Preserve multiline snippets in `.vto`/HTML-like docs with `<!-- deno-fmt-ignore -->` where needed.

## Verification

- [x] Run `deno fmt`.
- [x] Run `deno lint`.
- [x] Run `deno task test:unit` if implementation touches shared helpers or component behavior.
- [x] Run `deno task build` from the repo root.
- [x] Run `deno task build` from `test/` because theme rendering behavior changes.
- [x] Optionally run or extend browser smoke checks if converted snippets should be visually verified.

## Decisions

- [x] Use the existing `<code-example>` element as the preprocessor output.
  - Reason: this matches the current component registration in `src/components/code-example.ts` and avoids introducing a
    second public element name before there is a clear compatibility need.

- [x] Leave unlabeled fences unchanged by default.
  - Reason: the requested behavior is language-driven conversion, and unlabeled Markdown fences do not declare a
    supported language. Explicit text fences such as `` ```text ``, `` ```plaintext ``, or `` ```txt `` should convert
    to `<code-example language="text">`.

- [x] Do not add new language support as part of the first preprocessor change.
  - Reason: the preprocessor should first prove the conversion path against the languages already supported by
    `code-example`. Common docs languages such as `bash` can be added in a focused follow-up that also updates
    CodeMirror support, docs, and tests.

- [x] Follow the component's built-in language support rather than adding a separate user-configurable allowlist.
  - Reason: keeping one source of truth prevents the preprocessor from accepting languages the component cannot
    highlight. A simple global on/off option is enough for this first implementation.
