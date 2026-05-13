# Switch

**Full documentation:** https://webawesome.com/docs/components/switch


`<wa-switch>` Since 2.0 stable

Switches allow the user to toggle an option on or off.

```html
<wa-switch>Switch</wa-switch>
```

This component works with standard `<form>` elements. Please refer to the section on [form controls](https://webawesome.com/docs/form-controls) to learn more about form submission and client-side validation.

## Examples

### Checked

Use the `checked` attribute to activate the switch.

```html
<wa-switch checked>Checked</wa-switch>
```

### Disabled

Use the `disabled` attribute to disable the switch.

```html
<wa-switch disabled>Disabled</wa-switch>
```

### Sizes

Use the `size` attribute to change a switch's size.

```html
<wa-switch size="small">Small</wa-switch>
<br />
<wa-switch size="medium">Medium</wa-switch>
<br />
<wa-switch size="large">Large</wa-switch>
```

### Hint

Add descriptive hint to a switch with the `hint` attribute. For hints that contain HTML, use the `hint` slot instead.

```html
<wa-switch hint="What should the user know about the switch?">Label</wa-switch>
```

### Custom Styles

Use the available custom properties to change how the switch is styled.

```html
<wa-switch style="--width: 80px; --height: 40px; --thumb-size: 36px;">Really big</wa-switch>
```

## Importing

Autoloading components via [projects](https://webawesome.com/docs/#using-a-project) is the recommended way to import components. If you prefer to do it manually, use one of the following code snippets.

\*\*CDN\*\*

Let your project code do the work! [Sign up for free](https://webawesome.com/signup) to use a project with your very own CDN — it's the fastest and easiest way to use Web Awesome.

\*\*npm\*\*

To manually import this component from NPM, use the following code.

```js
import '@awesome.me/webawesome/dist/components/switch/switch.js';
```

\*\*React\*\*

To manually import this component from React, use the following code.

```js
import WaSwitch from '@awesome.me/webawesome/dist/react/switch';
```

## Slots

Learn more about [using slots](https://webawesome.com/docs/usage/#slots).

| Name | Description |
| --- | --- |
| (default) | The switch's label. |
| \`hint\` | \`hint\` Text that describes how to use the switch. Alternatively, you can use the attribute. |

## Attributes & Properties

Learn more about [attributes and properties](https://webawesome.com/docs/usage/#attributes-and-properties).

| Name | Description | Reflects |
| --- | --- | --- |
| \`checked\` | \`boolean\` Draws the switch in a checked state. Type | | |
| \`defaultChecked\` checked | \`boolean\` The default value of the form control. Primarily used for resetting the form control. Type | | |
| \`disabled\` disabled | \`boolean\` Disables the switch. Type Default false | | |
| \`hint\` hint | \`hint\` The switch's . If you need to display HTML, use the hint slot instead. Type string Default '' | | |
| \`name\` name | \`string \\| null\` The name of the switch, submitted as a name/value pair with form data. Type Default null | | |
| \`required\` required | \`boolean\` Makes the switch a required field. Type Default false | | |
| \`size\` size | \`'small' \\| 'medium' \\| 'large'\` The switch's size. Type Default 'medium' | | |
| \`value\` value | \`string \\| null\` The value of the switch, submitted as a name/value pair with form data. Type | | |
| \`withHint\` with-hint | \`with-hint\` Used for SSR. If you slot in hint, make sure to add to your component to get it to properly render with SSR. Type boolean Default false | | |

## Methods

Learn more about [methods](https://webawesome.com/docs/usage/#methods).

| Name | Description | Arguments |
| --- | --- | --- |
| \`blur()\` | Removes focus from the switch. | |
| \`click()\` | Simulates a click on the switch. | |
| \`focus()\` | Sets focus on the switch. | \`options: FocusOptions\` |

## Events

Learn more about [events](https://webawesome.com/docs/usage/#events).

| Name | Description |
| --- | --- |
| \`blur\` | Emitted when the control loses focus. |
| \`change\` | Emitted when the control's checked state changes. |
| \`focus\` | Emitted when the control gains focus. |
| \`input\` | Emitted when the control receives input. |
| \`wa-invalid\` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS custom properties

Learn more about [CSS custom properties](https://webawesome.com/docs/customizing/#custom-properties).

| Name | Description |
| --- | --- |
| \`--height\` | The height of the switch. |
| \`--thumb-size\` | The size of the thumb. |
| \`--width\` | The width of the switch. |

## CSS parts

Learn more about [CSS parts](https://webawesome.com/docs/customizing/#css-parts).

| Name | Description | CSS selector |
| --- | --- | --- |
| \`base\` | The component's base wrapper. | \`::part(base)\` |
| \`control\` | The control that houses the switch's thumb. | \`::part(control)\` |
| \`hint\` | The hint's wrapper. | \`::part(hint)\` |
| \`label\` | The switch's label. | \`::part(label)\` |
| \`thumb\` | The switch's thumb. | \`::part(thumb)\` |

**Need a hand?** Report a bug Ask for help