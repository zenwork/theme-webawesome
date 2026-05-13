import { css, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { json as jsonLanguage } from '@codemirror/lang-json'
import { html as htmlLanguage } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'

class CodeExample extends LitElement {
  static override styles = css`
    :host {
      display: block;
      border: 1px solid var(--wa-color-neutral-300);
      border-radius: var(--wa-border-radius-medium);
      overflow: hidden;
    }

    #editor {
      min-height: 64px;
    }

    .cm-editor {
      font-size: 0.8125rem;
    }

    .cm-scroller {
      font-family: Monaco, Menlo, Ubuntu Mono, monospace;
      line-height: 1.4;
    }
  `

  @property({ type: String })
  code = ''

  @property({ type: String })
  language: 'json' | 'html' | 'javascript' | 'typescript' | 'text' = 'text'

  @property({ type: Boolean, attribute: 'line-numbers' })
  lineNumbers = true

  private _editor: EditorView | null = null

  override connectedCallback(): void {
    super.connectedCallback()
    if (!this.code) {
      this.code = this.getNormalizedSlottedCode()
    }
  }

  override disconnectedCallback(): void {
    this._editor?.destroy()
    this._editor = null
    super.disconnectedCallback()
  }

  protected override firstUpdated(): void {
    if (!this.code) {
      this.code = this.getNormalizedSlottedCode()
    }
    this.mountEditor()
  }

  protected override updated(changed: Map<string, unknown>): void {
    if (!this._editor) {
      return
    }

    if (changed.has('code')) {
      const current = this._editor.state.doc.toString()
      if (current !== this.code) {
        this._editor.dispatch({
          changes: { from: 0, to: current.length, insert: this.code },
        })
      }
    }

    if (changed.has('language') || changed.has('lineNumbers')) {
      this._editor.destroy()
      this._editor = null
      this.mountEditor()
    }
  }

  private mountEditor(): void {
    const parent = this.renderRoot.querySelector<HTMLElement>('#editor')
    if (!parent) {
      return
    }

    const extensions: unknown[] = [
      oneDark,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      EditorView.editable.of(false),
    ]
    if (this.lineNumbers) {
      extensions.unshift(lineNumbers())
    }
    const language = this.getLanguageExtension()
    if (language) {
      extensions.push(language)
    }

    const state = EditorState.create({
      doc: this.code,
      extensions: extensions as never[],
    })

    this._editor = new EditorView({
      state,
      parent,
    })
  }

  private handleSlotChange = (): void => {
    if (this.hasAttribute('code')) {
      return
    }
    this.code = this.getNormalizedSlottedCode()
  }

  private getNormalizedSlottedCode(): string {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot')
    const raw = slot?.assignedNodes({ flatten: true }).map((node) => node.textContent ?? '').join('') ??
      this.textContent ??
      ''

    const lines = raw.replaceAll('\r\n', '\n').split('\n')
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift()
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop()
    }

    let minIndent = Number.POSITIVE_INFINITY
    for (const line of lines) {
      if (!line.trim()) continue
      const indent = line.match(/^[\t ]*/)?.[0].length ?? 0
      minIndent = Math.min(minIndent, indent)
    }

    if (!Number.isFinite(minIndent)) {
      return ''
    }

    return lines.map((line) => line.slice(minIndent)).join('\n')
  }

  private getLanguageExtension(): unknown | null {
    if (this.language === 'json') return jsonLanguage()
    if (this.language === 'html') return htmlLanguage()
    if (this.language === 'javascript') return javascript()
    if (this.language === 'typescript') return javascript({ typescript: true })
    return null
  }

  protected override render() {
    return html`
      <slot @slotchange="${this.handleSlotChange}" hidden></slot>
      <div id="editor"></div>
    `
  }
}

if (!customElements.get('code-example')) {
  customElements.define('code-example', CodeExample)
}
