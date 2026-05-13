# Radio

**Full documentation:** https://webawesome.com/docs/components/radio


`<wa-radio>` Since 2.0 stable

Radios allow the user to select a single option from a group.

This component must be used as a child of `<wa-radio-group>`. Please see the [Radio Group docs](https://webawesome.com/docs/components/radio-group) to see examples of this component in action.

## Importing

Autoloading components via [projects](https://webawesome.com/docs/#using-a-project) is the recommended way to import components. If you prefer to do it manually, use one of the following code snippets.

\*\*CDN\*\*

Let your project code do the work! [Sign up for free](https://webawesome.com/signup) to use a project with your very own CDN — it's the fastest and easiest way to use Web Awesome.

\*\*npm\*\*

To manually import this component from NPM, use the following code.

```js
import '@awesome.me/webawesome/dist/components/radio/radio.js';
```

\*\*React\*\*

To manually import this component from React, use the following code.

```js
import WaRadio from '@awesome.me/webawesome/dist/react/radio';
```

## Slots

Learn more about [using slots](https://webawesome.com/docs/usage/#slots).

| Name | Description |
| --- | --- |
| (default) | The radio's label. |

## Attributes & Properties

Learn more about [attributes and properties](https://webawesome.com/docs/usage/#attributes-and-properties).

| Name | Description | Reflects |
| --- | --- | --- |
| \`appearance\` appearance | \`'default' \\| 'button'\` The radio's visual appearance. Type Default 'default' | | |
| \`disabled\` disabled | \`boolean\` Disables the radio. Type Default false | | |
| \`size\` size | \`'small' \\| 'medium' \\| 'large'\` The radio's size. When used inside a radio group, the size will be determined by the radio group's size, which will override this attribute. Type | | |
| \`value\` value | \`string\` The radio's value. When selected, the radio group will receive this value. Type | | |

## Events

Learn more about [events](https://webawesome.com/docs/usage/#events).

| Name | Description |
| --- | --- |
| \`blur\` | Emitted when the control loses focus. |
| \`focus\` | Emitted when the control gains focus. |

## CSS custom properties

Learn more about [CSS custom properties](https://webawesome.com/docs/customizing/#custom-properties).

| Name | Description |
| --- | --- |
| \`--checked-icon-color\` | The color of the checked icon. |
| \`--checked-icon-scale\` | The size of the checked icon relative to the radio. |

## Custom States

Learn more about [custom states](https://webawesome.com/docs/customizing/#custom-states).

| Name | Description | CSS selector |
| --- | --- | --- |
| \`checked\` | Applied when the control is checked. | \`:state(checked)\` |
| \`disabled\` | Applied when the control is disabled. | \`:state(disabled)\` |

## CSS parts

Learn more about [CSS parts](https://webawesome.com/docs/customizing/#css-parts).

| Name | Description | CSS selector |
| --- | --- | --- |
| \`checked-icon\` | The checked icon. | \`::part(checked-icon)\` |
| \`control\` | The circular container that wraps the radio's checked state. | \`::part(control)\` |
| \`label\` | The container that wraps the radio's label. | \`::part(label)\` |

## Dependencies

This component automatically imports the following elements. Sub-dependencies, if any exist, will also be included in this list.

-   [`<wa-icon>`](https://webawesome.com/docs/components/icon)

**Need a hand?** Report a bug Ask for help