import { html, LitElement, PropertyValueMap } from 'lit'
import { property, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import Prism from 'prismjs'
import 'prismjs/components/prism-json.js'
import 'prismjs/components/prism-markup.js'
import { styles } from './styles.ts'
import { parseJSON, renderTemplate, TemplateData } from './template-renderer.ts'

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
  layout: 'horizontal' | 'tabs' = 'horizontal'

  @property({ type: String, attribute: 'default-tab' })
  defaultTab: 'data' | 'markup' | 'output' = 'output'

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

  @state()
  private _activeTab: 'data' | 'markup' | 'output' = 'output'

  @state()
  private _isCompact = false

  private _mediaQuery: MediaQueryList | null = null

  override connectedCallback(): void {
    super.connectedCallback()
    this._activeTab = this.defaultTab
    this._mediaQuery = globalThis.matchMedia('(max-width: 768px)')
    this._isCompact = this._mediaQuery.matches
    this._mediaQuery.addEventListener('change', this.handleMediaChange)
    if (this.data || this.template || this.imports) {
      this.processData()
      this.requestUpdate()
    }
  }

  override disconnectedCallback(): void {
    this._mediaQuery?.removeEventListener('change', this.handleMediaChange)
    this._mediaQuery = null
    super.disconnectedCallback()
  }

  private handleMediaChange = (event: MediaQueryListEvent): void => {
    this._isCompact = event.matches
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

    void this.loadImports()
  }

  private async loadImports(): Promise<void> {
    try {
      // Always load split-panel since it's required for the layout
      // await import('webawesome/components/split-panel/split-panel.js')

      const importList = JSON.parse(this.imports) as string[]
      for (const componentName of importList) {
        await import(`webawesome/components/${componentName}/${componentName}.js`)
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

  private renderTabs(): unknown {
    const tabs: Array<{ key: 'data' | 'markup' | 'output'; label: string }> = [
      { key: 'data', label: 'Data' },
      { key: 'markup', label: 'Markup' },
      { key: 'output', label: 'Output' },
    ]

    let tabContent: unknown = this.renderOutputPane()
    if (this._activeTab === 'data') {
      tabContent = this.renderPane('JSON Data', this._highlightedJson, 'json', 'copy-json')
    } else if (this._activeTab === 'markup') {
      tabContent = this.renderPane('HTML Markup', this._highlightedHtml, 'html', 'copy-html')
    }

    return html`
      <div class="tabs-toolbar" role="tablist" aria-label="Demo pane sections">
        ${tabs.map((tab) => html`
          <button
            class="tab-btn ${this._activeTab === tab.key ? 'is-active' : ''}"
            role="tab"
            aria-selected="${this._activeTab === tab.key}"
            @click="${() => (this._activeTab = tab.key)}"
          >
            ${tab.label}
          </button>
        `)}
      </div>
      ${tabContent}
    `
  }

  protected override render(): unknown {
    if (this._error && !this._parsedData) {
      return html`
        <div class="error">${this._error}</div>
      `
    }

    if (this.layout === 'tabs' || this._isCompact) {
      return this.renderTabs()
    }

    return html`
      <wa-split-panel position="33">
        <div slot="start">${this.renderPane('JSON Data', this._highlightedJson, 'json', 'copy-json')}</div>

        <wa-split-panel slot="end" position="50">
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
