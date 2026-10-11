---
layout: layouts/base.vto
title: Demo Pane
order: 4
---

# `<demo-pane>`

The demo-pane component is a web component for binding a json object to a lit-html template and then render the output. It is the equivalent of doing: 

```html
<script type="module">
  import {html, render} from 'lit-html';
  const data = {name: 'World'};
  const myTemplate = (name) => html`<div>Hello ${name}</div>`;

  // Render the template with some data
  render(myTemplate(data), document.body);
</script>
```
Demo Pane is:
- shows you the input and the output
- it is editable
- it can be resized to fir the screen
- it comes with a markdown pre-processor for easy markup in markdown

