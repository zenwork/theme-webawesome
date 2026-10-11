---
layout: layouts/base.vto
title: Component Examples
order: 2
---

# Component Examples

Feature coverage page for `code-example` and `demo-pane` in the test site.

## Code Example (Typed Source)

```typescript
import { html } from "lit";

const release = {
  version: "v0.2.0",
  status: "stable",
};

console.log(`${release.version} is ${release.status}`);
```

## Code Example (HTML Fence)

```html
<wa-callout variant="brand">
  <strong>Auto-detected HTML</strong>
  <p>Slotted markup should render as source without escaping.</p>
</wa-callout>
```

## Code Example (CSS)

```css
.release-banner {
  display: grid;
  gap: 0.5rem;
  color: var(--wa-color-brand-fill-loud);
}
```

## Code Example (Padded TSX)

<!-- code-example padded -->

```tsx
export function ReleaseBadge() {
  return <wa-badge variant="success">Ready</wa-badge>;
}
```

## Editable Demo Pane

<!-- demo-pane imports="card,badge" output-background="var(--wa-color-neutral-50)" editor-open -->

```json
{
  "title": "Release v0.2.0",
  "state": "Ready",
  "items": [
    "Navigation offsets",
    "TOC active state",
    "Resizable editors"
  ]
}
```

```html
<wa-card>
  <strong>${title}</strong>
  <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap">
    <wa-badge variant="success">${state}</wa-badge>
  </div>
  <ul style="margin: 0.75rem 0 0 1rem">
    ${items.map((item) => html`<li>${item}</li>`)}
  </ul>
</wa-card>
```

## Read-only Demo Pane

<!-- demo-pane imports="button,badge" readonly fit-content -->

```json
{
  "label": "Deploy",
  "state": "Stable",
  "version": "v0.2.0"
}
```

```html
<div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap">
  <wa-button variant="brand" size="small">${label}</wa-button>
  <wa-badge variant="success">${state}</wa-badge>
  <wa-badge variant="neutral">${version}</wa-badge>
</div>
```

## Long Output + Fit Action

<!-- demo-pane output-background="var(--wa-color-neutral-50)" editor-open -->

```json
{
  "title": "Long Output",
  "rows": [
    "Row 01: release context",
    "Row 02: release context",
    "Row 03: release context",
    "Row 04: release context",
    "Row 05: release context",
    "Row 06: release context",
    "Row 07: release context",
    "Row 08: release context",
    "Row 09: release context",
    "Row 10: release context",
    "Row 11: release context",
    "Row 12: release context",
    "Row 13: release context",
    "Row 14: release context",
    "Row 15: release context",
    "Row 16: release context",
    "Row 17: release context",
    "Row 18: release context",
    "Row 19: release context",
    "Row 20: release context",
    "Row 21: release context",
    "Row 22: release context",
    "Row 23: release context",
    "Row 24: release context",
    "Row 25: release context",
    "Row 26: release context",
    "Row 27: release context",
    "Row 28: release context",
    "Row 29: release context",
    "Row 30: release context"
  ]
}
```

```html
<section>
  <h3>${title}</h3>
  <div style="display: grid; gap: 0.25rem">
    ${rows.map((row) => html`<p style="margin: 0">${row}</p>`)}
  </div>
</section>
```
