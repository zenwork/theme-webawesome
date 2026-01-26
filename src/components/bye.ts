import {html,LitElement} from 'npm:lit-element@3.3.2'

class Bye extends LitElement {
  protected override render(): unknown {
    return html`GOODBYE WORLD!`
  }
}

if (!customElements.get("my-bye")) {
  customElements.define("my-bye", Bye);
}
