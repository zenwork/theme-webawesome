import { html, LitElement } from 'lit'

class Bye extends LitElement {
  protected override render(): unknown {
    return html`
      GOODBYE WORLD!
    `
  }
}

if (!customElements.get('my-bye')) {
  customElements.define('my-bye', Bye)
}
