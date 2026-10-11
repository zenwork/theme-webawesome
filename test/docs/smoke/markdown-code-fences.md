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

<!-- demo-pane imports="badge" default-tab="output" fit-content -->

```json
{
  "label": "Demo pane smoke",
  "variant": "brand"
}
```

```html
<wa-badge variant="${variant}">
  ${label}
</wa-badge>
```

This unsupported fence should remain a regular Markdown code block.

```bash
deno task build
```
