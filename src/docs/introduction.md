---
layout: layouts/base.vto
title: Design
order: 20
---

# Design

This theme is built for technical documentation sites that need code-first content, lightweight client behavior, and
reliable composition points.

It combines:

- Lume for static site generation
- WebAwesome components (free mode by default)
- Lit-based custom elements for interactive docs surfaces
- runnable examples through `demo-pane`

## What You Get

- a base docs layout with site navigation, page TOC, and theme toggle
- WebAwesome loader and styles configured through theme options
- built-in docs components such as `code-example`, `demo-pane`, and `site-toc-tree`
- extension points for your own Lit component bundles

## Documentation Path

- [Documentation Guide](/docs/): high-level feature index and reading path
- [Getting Started](/docs/getting-started/): install and first build
- [Theme Configuration](/docs/configuration/): free vs Pro asset paths and entrypoints
- [Theme Components](/docs/components/): built-in component surfaces
- [Navigation and TOC](/docs/navigation-and-toc/): site/sidebar/page TOC behavior
- [Registering Components](/docs/extending-components/): loading your own Lit bundles

## Scope

The theme emphasizes web components and avoids heavyweight frontend frameworks. For custom interactive docs features,
the expected pattern is to register Lit components in your own entrypoint and include them through theme configuration.
