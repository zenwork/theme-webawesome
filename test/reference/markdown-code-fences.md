---
layout: layouts/base.vto
title: Markdown Code Fences
order: 4
---

# Markdown Code Fences

This page demos Markdown triple-backtick fences being converted to `<code-example>` when the language is supported.

## TypeScript Fence

```ts
type ReleaseState = 'draft' | 'ready'

const state: ReleaseState = 'ready'
console.log({ state })
```

## TSX Fence

```tsx
export function ReleaseBadge() {
  return <wa-badge variant='success'>Ready</wa-badge>
}
```

## JSON Fence

```json
{
  "component": "code-example",
  "source": "markdown-fence",
  "converted": true
}
```

## Text Fence

```txt
Explicit text fences convert to code-example.
Unlabeled fences remain regular Markdown code blocks.
```

## Fence Options Comment

Place a `code-example` HTML comment immediately before a supported fence to pass boolean attributes.

<!-- code-example padded no-line-numbers -->
```ts
const options = ['padded', 'no-line-numbers']
console.log(options.join(', '))
```

## Unsupported Fence

This Bash fence should remain a normal Markdown code block because `bash` is not currently supported by `code-example`.

```bash
deno task build
```
