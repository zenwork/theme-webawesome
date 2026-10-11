---
layout: layouts/base.vto
title: Web Component
order: 0
---

# Demo Pane

## Features

* edit and render
* resize view
* format content
* reset to original content

## Attributes

* data
* template
* imports
* style
* editor-open
* no-number

## Editable

html:

```html
    <demo-pane
      data='{"title":"Release v0.2.0","state":"Ready","items":["Navigation offsets","TOC active state","Resizable editors"]}'
      template='<wa-card><strong>${title}</strong><div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap"><wa-badge variant="success">${state}</wa-badge></div><ul style="margin:.75rem 0 0 1rem">${items.map((item) => html`<li>${item}</li>`)}</ul></wa-card>'
      imports='["card","badge"]'
      style="--demo-pane-output-background: var(--wa-color-neutral-50)"
      editor-open
    >
    </demo-pane>
```
rendered component:

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

## Read-only

html:

```html
    <demo-pane
          data='{"label":"Deploy","state":"Stable","version":"v0.2.0"}'
          template='<div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap"><wa-button variant="brand" size="small">${label}</wa-button><wa-badge variant="success">${state}</wa-badge><wa-badge variant="neutral">${version}</wa-badge></div>'
          imports='["button","badge"]'
          readonly
          fit-content
        >
    </demo-pane>

```
rendered component:

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

## Resizable

The component manages long input and output. Press the resizing buttons or grab the handles to resize the views

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
