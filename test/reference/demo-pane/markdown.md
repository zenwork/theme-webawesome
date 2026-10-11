---
layout: layouts/base.vto
title: Markdown Code Fence
order: 1
---

# Render Code Fences

instead of writing `html` in `markdown` use the preprocessor to convert markdown to a `demo-pane`.

## As a Code-Fence Group

Place a `demo-pane` HTML comment immediately before a JSON fence and an HTML fence to create an interactive demo. The
HTML fence is treated as Lit template source, so interpolation expressions are preserved.

combine a marker comment with two code fences:
```text 
    <!-- demo-pane imports="button" default-tab="output" editor-open fit-content -->
    
    ```json
    {
      "label": "Deploy It!",
      "variant": "brand",
      "disabled": false
    }
    ```
    
    ```html
    <wa-button variant=${variant} ?disabled=${disabled}>
      ${label}
    </wa-button>
    ```
```

The theme will output the full component like this...

<!-- demo-pane imports="button,badge" default-tab="output" editor-open fit-content -->

```json
{
  "label": "Deploy It!",
  "variant": "brand",
  "disabled": false
}
```

```html
<wa-button variant=${variant} ?disabled=${disabled}>
  ${label}
</wa-button>
```
