# Animated Image

**Full documentation:** https://webawesome.com/docs/components/animated-image


`<wa-animated-image>`

Stable [Media](https://webawesome.com/docs/components/?category=media) [Since 2.0](https://webawesome.com/docs/resources/changelog#wa_200)

Animated images display GIFs and WEBPs with controls to play and pause them on demand. Use them when you want motion but need to give users control over when it plays.

```html
<wa-animated-image
  src="https://shoelace.style/assets/images/walk.gif"
  alt="Animation of untied shoes walking on pavement"
></wa-animated-image>
```

This component uses `<canvas>` to draw freeze frames, so images are subject to [cross-origin restrictions](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image).

## Examples

Link to This Section

### WEBP Images

Link to This Section

Both GIF and WEBP images are supported.

```html
<wa-animated-image
  src="https://shoelace.style/assets/images/tie.webp"
  alt="Animation of a shoe being tied"
></wa-animated-image>
```

### Setting a Width and Height

Link to This Section

To set a custom size, apply a width and/or height to the host element.

```html
<wa-animated-image
  src="https://shoelace.style/assets/images/walk.gif"
  alt="Animation of untied shoes walking on pavement"
  style="width: 150px; height: 200px;"
>
</wa-animated-image>
```

### Customizing the Control Box

Link to This Section

You can change the appearance and location of the control box by targeting the `control-box` part in your styles.

```html
<wa-animated-image
  src="https://shoelace.style/assets/images/walk.gif"
  alt="Animation of untied shoes walking on pavement"
  class="animated-image-custom-control-box"
></wa-animated-image>

<style>
  .animated-image-custom-control-box::part(control-box) {
    top: auto;
    right: auto;
    bottom: 1rem;
    left: 1rem;
    background-color: deeppink;
    border: none;
    color: pink;
  }
</style>
```

## Importing

Link to This Section

If you're using the autoloader or a hosted project, components load on demand — no manual import needed. To cherry-pick a component manually, use one of the following snippets.

\*\*CDN\*\*

Import this component directly from the CDN:

```js
import 'https://ka-f.webawesome.com/webawesome@3.8.0/components/animated-image/animated-image.js';
```

\*\*npm\*\*

After installing Web Awesome via npm, import this component:

```js
import '@awesome.me/webawesome/dist/components/animated-image/animated-image.js';
```

\*\*Self-Hosted\*\*

If you're self-hosting Web Awesome, import this component from your server:

```js
import './webawesome/dist/components/animated-image/animated-image.js';
```

\*\*React\*\*

To import this component for React 18 or below, use the following code:

```js
import WaAnimatedImage from '@awesome.me/webawesome/dist/react/animated-image/index.js';
```

## Slots

Link to This Section

Learn more about [using slots](https://webawesome.com/docs/usage/#slots).

| Name | Description |
| --- | --- |
| \`pause-icon\` | \`\` Optional play icon to use instead of the default. Works best with . |

## Attributes & Properties

Link to This Section

Learn more about [attributes and properties](https://webawesome.com/docs/usage/#attributes-and-properties).

| Name | Description | Reflects |
| --- | --- | --- |
| \`alt\` alt | \`string\` A description of the image used by assistive devices. Type | | |
| \`play\` play | \`boolean\` Plays the animation. When this attribute is remove, the animation will pause. Type | | |
| \`src\` src | \`string\` The path to the image to load. Type | | |

## SSR

Link to This Section

Using `<wa-animated-image>` with SSR

Due to limitations of the browser, this component is not able to be SSR'ed. You can use a `<video>` tag, but the controls will not work, and it will always auto-play the gif or webp.

Learn more about [Web Awesome and Server-Side Rendering](https://webawesome.com/docs/ssr).

## Events

Link to This Section

Learn more about [events](https://webawesome.com/docs/usage/#events).

| Name | Description |
| --- | --- |
| \`wa-error\` | Emitted when the image fails to load. |
| \`wa-load\` | Emitted when the image loads successfully. |

## CSS custom properties

Link to This Section

Learn more about [CSS custom properties](https://webawesome.com/docs/usage/#custom-properties).

| Name | Description |
| --- | --- |
| \`--control-box-size\` | The size of the icon box. |
| \`--icon-size\` | The size of the play/pause icons. |

## CSS parts

Link to This Section

Learn more about [CSS parts](https://webawesome.com/docs/usage/#css-parts).

| Name | Description | CSS selector |
| --- | --- | --- |
| \`control-box\` | The container that surrounds the pause/play icons and provides their background. | \`::part(control-box)\` |

## Dependencies

Link to This Section

This component automatically imports the following elements. Sub-dependencies, if any exist, will also be included in this list.

-   [`<wa-icon>`](https://webawesome.com/docs/components/icon)

**Need a hand?** Report a bug Ask for help