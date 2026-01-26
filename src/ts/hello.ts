
import "npm:@awesome.me/webawesome@^3.1.0/dist/components/button/button.js";
import {html,LitElement} from 'npm:lit-element@3.3.2'

class Hello extends LitElement {
  protected override render(): unknown {
    return html`
      HELLO WORLD! <wa-button variant="brand">HI!</wa-button>
    `;
  }
}

if (!customElements.get("my-hello")) {
  customElements.define("my-hello", Hello);
}

