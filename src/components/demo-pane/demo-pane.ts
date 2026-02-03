import { html, LitElement, PropertyValueMap } from 'npm:lit@^3.3.2'
import { property, state } from 'npm:lit@^3.3.2/decorators.js'
import { unsafeHTML } from 'npm:lit@^3.3.2/directives/unsafe-html.js'
import Prism from 'npm:prismjs@^1.29.0'
import 'npm:prismjs@^1.29.0/components/prism-json.js'
import 'npm:prismjs@^1.29.0/components/prism-markup.js'
import { styles } from './styles.ts'
import { parseJSON, renderTemplate, TemplateData } from './template-renderer.ts'

// Import WebAwesome components
import 'npm:@awesome.me/webawesome@^3.1.0/dist/webawesome.loader.js'

/**
 * A 3-pane demo component for showcasing web components
 * Displays JSON data, HTML markup, and rendered output side-by-side
 */
class DemoPane extends LitElement {
  static override styles = styles

  @property({ type: String })
  data = '{}'

  @property({ type: String })
  template = ''

  @property({ type: String })
  imports = '[]'

  @property({ type: String })
  layout: 'horizontal' | 'vertical' | 'tabs' = 'horizontal'

  @state()
  private _parsedData: TemplateData | null = null

  @state()
  private _renderedHtml = ''

  @state()
  private _error: string | null = null

  @state()
  private _highlightedJson = ''

  @state()
  private _highlightedHtml = ''

  override connectedCallback(): void {
    super.connectedCallback()
    if (this.data || this.template || this.imports) {
      this.processData()
      this.requestUpdate()
    }
  }

  protected override updated(_changedProperties: PropertyValueMap<DemoPane>): void {
    super.updated(_changedProperties)
    if (_changedProperties.has('data') || _changedProperties.has('template') || _changedProperties.has('imports')) {
      this.processData()
    }
  }

  private processData(): void {
    this._error = null

    // Parse JSON data
    const parsed = parseJSON(this.data)
    if (!parsed) {
      this._error = 'Invalid JSON data'
      return
    }
    this._parsedData = parsed

    // Render template with data
    try {
      this._renderedHtml = renderTemplate(this.template, parsed)
    } catch (e) {
      this._error = `Template rendering error: ${e}`
      return
    }

    // Format and highlight JSON
    const formattedJson = JSON.stringify(parsed, null, 2)
    this._highlightedJson = Prism.highlight(formattedJson, Prism.languages.json, 'json')

    // Highlight HTML
    this._highlightedHtml = Prism.highlight(this._renderedHtml, Prism.languages.markup, 'markup')

    // Load required imports
    this.loadImports()

    // console.log(this._parsedData, this._renderedHtml, this._highlightedJson, this._highlightedHtml)
  }

  private async loadImports(): Promise<void> {
    try {
      const importList = JSON.parse(this.imports) as string[]
      const baseUrl = 'npm:@awesome.me/webawesome@^3.1.0/dist/components'

      for (const componentName of importList) {
        await import(`${baseUrl}/${componentName}/${componentName}.js`)
      }
    } catch (e) {
      console.warn('Failed to load imports:', e)
    }
  }

  private copyToClipboard(text: string, buttonId: string): void {
    navigator.clipboard.writeText(text).then(() => {
      const button = this.shadowRoot?.querySelector(`#${buttonId}`)
      if (button) {
        const icon = button.querySelector('wa-icon')
        if (icon) {
          icon.setAttribute('name', 'check')
          setTimeout(() => {
            icon.setAttribute('name', 'copy')
          }, 2000)
        }
      }
    })
  }

  private renderPane(title: string, content: string, type: 'json' | 'html', buttonId: string): unknown {
    const copyText = type === 'json' ? this.data : this._renderedHtml
    console.log('content:', content)
    return html`
      <div class="pane">
        <div class="pane-header">
          <span>${title}</span>
          <wa-button
            id="${buttonId}"
            class="copy-button"
            variant="neutral"
            appearance="plain"
            size="small"
            @click="${() => this.copyToClipboard(copyText, buttonId)}"
          >
            <wa-icon name="copy" label="Copy"></wa-icon>
          </wa-button>
        </div>
        <div class="pane-content">
          <pre><code class="language-${type}">${unsafeHTML(content)}</code></pre>
        </div>
      </div>
    `
  }

  private renderOutputPane(): unknown {
    return html`
      <div class="pane">
        <div class="pane-header">
          <span>Rendered Output</span>
        </div>
        <div class="pane-content">
          ${this._error
            ? html`
              <div class="error">${this._error}</div>
            `
            : html`
              <div class="output-container">${unsafeHTML(this._renderedHtml)}</div>
            `}
        </div>
      </div>
    `
  }

  protected override render(): unknown {
    console.log('render')
    if (this._error && !this._parsedData) {
      return html`
        <div class="error">${this._error}</div>
      `
    }

    return html`
      <wa-split-panel>

        <div slot="start">${this.renderPane('JSON Data', this._highlightedJson, 'json', 'copy-json')}</div>

        <wa-split-panel slot="end" >
          <div slot="start">${this.renderPane('HTML Markup', this._highlightedHtml, 'html', 'copy-html')}</div>
          <div slot="end">${this.renderOutputPane()}</div>
        </wa-split-panel>
      </wa-split-panel>
    `

  }
}

if (!customElements.get('demo-pane')) {
  customElements.define('demo-pane', DemoPane)
}

export { DemoPane }
