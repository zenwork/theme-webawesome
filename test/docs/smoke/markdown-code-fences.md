---
layout: layouts/base.vto
title: Markdown Fence Smoke
---

# Markdown Fence Smoke

This smoke page verifies that a supported Markdown fence renders through `<code-example>`.

<!-- code-example padded no-line-numbers -->

```tsx
export function SmokeStatus() {
  return <wa-badge variant='brand'>Markdown fence converted</wa-badge>
}
```

This unsupported fence should remain a regular Markdown code block.

```bash
deno task build
```
