import { html, LitElement } from 'lit'

export class Hello extends LitElement {
  protected override render(): unknown {
    return html`
      HELLO WORLD! <wa-button variant="brand">HI!</wa-button>
    `
  }
}

if (!customElements.get('my-hello')) {
  customElements.define('my-hello', Hello)
}
