# Theme WebAwesome (Lume)

A Lume theme for technical documentation with:

- WebAwesome components (free by default)
- Lit-based web components
- runnable code examples via `demo-pane`

## Project focus

- Build a technical documentation theme for Lume.
- Use WebAwesome (free by default) with optional Pro configuration.
- Keep the interactive layer Lit + web components (no large framework required).
- Make it easy for theme users to inject their own Lit-based components.

## Quick start (theme consumer)

1. Add the theme in your Lume config.
2. Build or serve your site.
3. Add your docs pages and Lit components.

```ts
import lume from 'lume/mod.ts'
import theme from 'https://cdn.jsdelivr.net/gh/<user>/<repo>@<tag>/mod.ts'

const site = lume()

site.use(theme())

export default site
```

Run:

```sh
deno task serve
```

## What the theme wires up

- WebAwesome CSS + loader scripts in the base layout
- Theme components bundle loaded from `componentEntrypoint` (default: `components/index.ts`)
- Site/table-of-contents navigation helpers (`nav` + markdown `toc`)
- HTML heading preprocessing that assigns IDs and builds page TOC data from `h2`-`h6`
- Docs plugin stack: `lightningcss`, `base_path`, `metas`, `sitemap`, `favicon`, `esbuild`

## WebAwesome: free vs Pro configuration

```ts
import lume from 'lume/mod.ts'
import theme from 'theme/mod.ts'

const site = lume()

site.use(theme({
  webawesome: {
    mode: 'free', // or 'pro'
    // Free default:
    // assetBasePath: '/lib/webawesome/dist-cdn',
    // customPropertiesCssPath: '/styles/webawesome-theme.css',
    //
    // Pro example:
    // assetBasePath: '/lib/webawesome-pro/dist-cdn',
    // cssPath: '/lib/webawesome-pro/dist-cdn/styles/webawesome.css',
    // customPropertiesCssPath: '/styles/webawesome-theme.css',
    // loaderPath: '/lib/webawesome-pro/dist-cdn/webawesome.loader.js',
    // splitPanelPath: '/lib/webawesome-pro/dist-cdn/components/split-panel/split-panel.js',
  },
}))

export default site
```

## Customize WebAwesome tokens with CSS custom properties

Point the theme at your own CSS file and define the variables WebAwesome exposes:

```ts
site.use(theme({
  webawesome: {
    customPropertiesCssPath: '/styles/webawesome-theme.css',
  },
}))
```

```css
:root,
.wa-light {
  --wa-color-brand-fill-loud: oklch(59% 0.16 258);
}

.wa-dark {
  --wa-color-brand-fill-loud: oklch(72% 0.12 258);
}
```

## Inject your Lit components

Use a component entrypoint that registers your custom elements.

```ts
// components/custom-entry.ts
import './my-card.ts'
import './my-playground.ts'
```

```ts
// components/my-card.ts
import { html, LitElement } from 'lit'

class MyCard extends LitElement {
  protected override render() {
    return html`
      <p>My custom Lit component</p>
    `
  }
}

if (!customElements.get('my-card')) {
  customElements.define('my-card', MyCard)
}
```

Then configure the theme:

```ts
site.use(theme({
  componentEntrypoint: 'components/custom-entry.ts',
  additionalComponentEntrypoints: [
    'components/analytics.ts',
  ],
}))
```

Notes:

- `componentEntrypoint` is loaded in the base layout as a module script.
- `additionalComponentEntrypoints` are added and bundled, but are not auto-injected by `src/_includes/layouts/base.vto`.
- Load additional entrypoints by importing them from your primary entrypoint, or by adding script tags in a custom
  layout.
- Always register custom elements with a guard:
  - `if (!customElements.get('my-tag')) customElements.define('my-tag', MyEl)`

## Local development and test-site workflow

Theme repo:

```sh
deno task serve
deno task build
deno lint
deno task test:browser
```

Integration test site (`test/`):

```sh
cd test
deno task serve
deno task build
```

## Theme consumer checklist

- [ ] `style.css` is included in generated output and loads in browser.
- [ ] WebAwesome CSS + loader URLs are reachable (default local `/lib/webawesome/dist-cdn` or configured path).
- [ ] `componentEntrypoint` points to a valid `.ts`/`.js` file.
- [ ] custom elements are registered before use in templates.
- [ ] If using `demo-pane`, template expressions use `${propName}` from JSON data.
- [ ] Root `deno task build` and `test/deno task build` both pass.

## Maintainer notes

- Update Lume deps: `deno task lume upgrade`
- Generate npm package metadata from `deno.json`: `deno task npm`
- Release notes: `release-please` is configured via `.github/workflows/release-please.yml`
