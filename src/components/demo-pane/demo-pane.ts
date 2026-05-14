import { html, LitElement, PropertyValueMap } from 'lit'
import { property, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json as jsonLanguage } from '@codemirror/lang-json'
import { html as htmlLanguage } from '@codemirror/lang-html'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import Prism from 'prismjs'
import 'prismjs/components/prism-json.js'
import 'prismjs/components/prism-markup.js'
import '../code-example.ts'
import { styles } from './styles.ts'
import { formatHtmlTemplate, parseJSON, RenderedTemplate, renderTemplate, TemplateData } from './template-renderer.ts'

const editableAttributeConverter = {
  fromAttribute: (value: string | null): boolean => {
    if (value === null) {
      return true
    }
    return value.trim().toLowerCase() !== 'false'
  },
  toAttribute: (value: boolean): string => (value ? '' : 'false'),
}

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

  @property({ reflect: true, converter: editableAttributeConverter })
  editable = true

  @property({ type: Boolean, attribute: 'readonly', reflect: true })
  readOnly = false

  @property({ type: String })
  layout: 'horizontal' | 'tabs' = 'horizontal'

  @property({ type: String, attribute: 'default-tab' })
  defaultTab: 'data' | 'markup' | 'output' = 'output'

  @property({ type: String, attribute: 'data-label' })
  dataLabel = ''

  @property({ type: String, attribute: 'template-label' })
  templateLabel = ''

  @property({ type: String, attribute: 'output-background' })
  outputBackground = ''

  @property({ type: Boolean, attribute: 'editor-open', reflect: true })
  editorOpen = false

  @state()
  private _parsedData: TemplateData | null = null

  @state()
  private _renderedHtml = ''

  @state()
  private _renderedTemplate: RenderedTemplate['template'] | null = null

  @state()
  private _error: string | null = null

  @state()
  private _highlightedJson = ''

  @state()
  private _highlightedHtml = ''

  @state()
  private _highlightedTemplate = ''

  @state()
  private _activeTab: 'data' | 'markup' | 'output' = 'output'

  @state()
  private _isCompact = false

  @state()
  private _draftData = '{}'

  @state()
  private _draftTemplate = ''

  @state()
  private _draftImports = '[]'

  @state()
  private _outputVersion = 0

  @state()
  private _editorHeight = 180

  @state()
  private _isResizingEditors = false

  @state()
  private _previewHeight = 320

  @state()
  private _isResizingPreview = false

  private _mediaQuery: MediaQueryList | null = null
  private readonly _loadedModules = new Set<string>()
  private _jsonEditor: EditorView | null = null
  private _templateEditor: EditorView | null = null
  private _syncingEditors = false
  private _didFormatInitialContent = false
  private _editorResizeStartY = 0
  private _editorResizeStartHeight = 180
  private _previewResizeStartY = 0
  private _previewResizeStartHeight = 320

  override connectedCallback(): void {
    super.connectedCallback()
    this._activeTab = this.defaultTab
    this._mediaQuery = globalThis.matchMedia('(max-width: 768px)')
    this._isCompact = this._mediaQuery.matches
    this._mediaQuery.addEventListener('change', this.handleMediaChange)
    this._draftData = this.data
    this._draftTemplate = this.template
    this._draftImports = this.imports
    this.formatInitialDrafts()
    if (this.data || this.template || this.imports) {
      this.processData()
      this.requestUpdate()
    }
  }

  override disconnectedCallback(): void {
    this._mediaQuery?.removeEventListener('change', this.handleMediaChange)
    this._mediaQuery = null
    globalThis.removeEventListener('pointermove', this.handleEditorResizeMove)
    globalThis.removeEventListener('pointerup', this.handleEditorResizeEnd)
    globalThis.removeEventListener('pointercancel', this.handleEditorResizeEnd)
    globalThis.removeEventListener('pointermove', this.handlePreviewResizeMove)
    globalThis.removeEventListener('pointerup', this.handlePreviewResizeEnd)
    globalThis.removeEventListener('pointercancel', this.handlePreviewResizeEnd)
    this._jsonEditor?.destroy()
    this._templateEditor?.destroy()
    this._jsonEditor = null
    this._templateEditor = null
    super.disconnectedCallback()
  }

  protected override firstUpdated(_changedProperties: PropertyValueMap<DemoPane>): void {
    super.firstUpdated(_changedProperties)
    if (this.editorOpen) {
      this.initEditors()
      this.syncEditorsFromDraft()
      this.refreshEditorLayout()
    }
  }

  private handleMediaChange = (event: MediaQueryListEvent): void => {
    this._isCompact = event.matches
  }

  protected override updated(_changedProperties: PropertyValueMap<DemoPane>): void {
    super.updated(_changedProperties)
    if (_changedProperties.has('data') || _changedProperties.has('template') || _changedProperties.has('imports')) {
      this._draftData = this.data
      this._draftTemplate = this.template
      this._draftImports = this.imports
      this.formatInitialDrafts()
      this.syncEditorsFromDraft()
      this.processData()
    }
    if (_changedProperties.has('editable') || _changedProperties.has('readOnly')) {
      if (!this.canEdit) {
        this.destroyEditors()
      }
    }
    if ((_changedProperties.has('editable') || _changedProperties.has('readOnly')) && this.canEdit) {
      this.initEditors()
    }
    if (_changedProperties.has('editorOpen') && this.editorOpen && this.canEdit) {
      this.initEditors()
      this.syncEditorsFromDraft()
      this.refreshEditorLayout()
    }
  }

  private get canEdit(): boolean {
    return this.editable && !this.readOnly
  }

  private processData(): void {
    this._error = null

    // Parse JSON data
    const parsed = parseJSON(this._draftData)
    if (!parsed) {
      this._error = 'Invalid JSON data'
      this.requestUpdate()
      return
    }
    this._parsedData = parsed

    // Render template with data
    try {
      const rendered = renderTemplate(this._draftTemplate, parsed)
      this._renderedTemplate = rendered.template
      this._renderedHtml = rendered.source
    } catch (e) {
      this._error = `Template rendering error: ${e}`
      this.requestUpdate()
      return
    }
    this._outputVersion += 1

    // Format and highlight JSON
    const formattedJson = JSON.stringify(parsed, null, 2)
    this._highlightedJson = Prism.highlight(formattedJson, Prism.languages.json, 'json')

    // Highlight rendered HTML for diagnostics panes
    this._highlightedHtml = Prism.highlight(this._renderedHtml, Prism.languages.markup, 'markup')
    this._highlightedTemplate = Prism.highlight(this._draftTemplate, Prism.languages.markup, 'markup')

    void this.loadImports()
    this.requestUpdate()
  }

  private updateEditorHighlighting(): void {
    const parsed = parseJSON(this._draftData)
    if (parsed) {
      const formattedJson = JSON.stringify(parsed, null, 2)
      this._highlightedJson = Prism.highlight(formattedJson, Prism.languages.json, 'json')
    } else {
      this._highlightedJson = Prism.highlight(this._draftData, Prism.languages.json, 'json')
    }
    this._highlightedTemplate = Prism.highlight(this._draftTemplate, Prism.languages.markup, 'markup')
  }

  private initEditors(): void {
    if (!this.canEdit) {
      return
    }

    const jsonHost = this.renderRoot.querySelector<HTMLElement>('#json-editor')
    const templateHost = this.renderRoot.querySelector<HTMLElement>('#template-editor')
    if (!jsonHost || !templateHost) {
      return
    }

    if (!this._jsonEditor) {
      this._jsonEditor = this.createEditor(jsonHost, this._draftData, jsonLanguage(), (value) => {
        if (this._syncingEditors) return
        this._draftData = value
        this.updateEditorHighlighting()
      })
    }

    if (!this._templateEditor) {
      this._templateEditor = this.createEditor(templateHost, this._draftTemplate, htmlLanguage(), (value) => {
        if (this._syncingEditors) return
        this._draftTemplate = value
        this.updateEditorHighlighting()
      })
    }
  }

  private createEditor(
    parent: HTMLElement,
    doc: string,
    languageExtension: unknown,
    onChange: (value: string) => void,
  ): EditorView {
    const state = EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              this.runDemo()
              return true
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        languageExtension as never,
        oneDark,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
      ],
    })
    return new EditorView({ state, parent })
  }

  private destroyEditors(): void {
    this._jsonEditor?.destroy()
    this._templateEditor?.destroy()
    this._jsonEditor = null
    this._templateEditor = null
  }

  private handleEditorResizeStart = (event: PointerEvent): void => {
    event.preventDefault()
    this._isResizingEditors = true
    this._editorResizeStartY = event.clientY
    this._editorResizeStartHeight = this._editorHeight
    this.requestUpdate()
    globalThis.addEventListener('pointermove', this.handleEditorResizeMove)
    globalThis.addEventListener('pointerup', this.handleEditorResizeEnd)
    globalThis.addEventListener('pointercancel', this.handleEditorResizeEnd)
  }

  private handleEditorEdgeResizeStart = (event: PointerEvent): void => {
    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) {
      return
    }
    const rect = target.getBoundingClientRect()
    const edgeDistance = rect.bottom - event.clientY
    if (edgeDistance < 0 || edgeDistance > 12) {
      return
    }
    this.handleEditorResizeStart(event)
  }

  private handleEditorResizeMove = (event: PointerEvent): void => {
    if (!this._isResizingEditors) {
      return
    }
    const deltaY = event.clientY - this._editorResizeStartY
    this._editorHeight = Math.max(120, Math.min(640, this._editorResizeStartHeight + deltaY))
    const nextHeight = `${this._editorHeight}px`
    for (const panel of this.renderRoot.querySelectorAll<HTMLElement>('.editor-panel-content')) {
      panel.style.setProperty('--demo-editor-height', nextHeight)
    }
    this.requestUpdate()
    this.refreshEditorLayout()
  }

  private handleEditorResizeEnd = (): void => {
    if (!this._isResizingEditors) {
      return
    }
    this._isResizingEditors = false
    this.requestUpdate()
    globalThis.removeEventListener('pointermove', this.handleEditorResizeMove)
    globalThis.removeEventListener('pointerup', this.handleEditorResizeEnd)
    globalThis.removeEventListener('pointercancel', this.handleEditorResizeEnd)
  }

  private handlePreviewResizeStart = (event: PointerEvent): void => {
    event.preventDefault()
    this._isResizingPreview = true
    this._previewResizeStartY = event.clientY
    this._previewResizeStartHeight = this._previewHeight
    this.requestUpdate()
    globalThis.addEventListener('pointermove', this.handlePreviewResizeMove)
    globalThis.addEventListener('pointerup', this.handlePreviewResizeEnd)
    globalThis.addEventListener('pointercancel', this.handlePreviewResizeEnd)
  }

  private handlePreviewResizeMove = (event: PointerEvent): void => {
    if (!this._isResizingPreview) {
      return
    }
    const deltaY = event.clientY - this._previewResizeStartY
    this._previewHeight = Math.max(220, Math.min(960, this._previewResizeStartHeight + deltaY))
    this.requestUpdate()
  }

  private handlePreviewResizeEnd = (): void => {
    if (!this._isResizingPreview) {
      return
    }
    this._isResizingPreview = false
    this.requestUpdate()
    globalThis.removeEventListener('pointermove', this.handlePreviewResizeMove)
    globalThis.removeEventListener('pointerup', this.handlePreviewResizeEnd)
    globalThis.removeEventListener('pointercancel', this.handlePreviewResizeEnd)
  }

  private refreshEditorLayout(): void {
    requestAnimationFrame(() => {
      this._jsonEditor?.requestMeasure()
      this._templateEditor?.requestMeasure()
    })
  }

  private syncEditorsFromDraft(): void {
    this._syncingEditors = true
    try {
      if (this._jsonEditor) {
        const current = this._jsonEditor.state.doc.toString()
        if (current !== this._draftData) {
          this._jsonEditor.dispatch({
            changes: { from: 0, to: current.length, insert: this._draftData },
          })
        }
      }
      if (this._templateEditor) {
        const current = this._templateEditor.state.doc.toString()
        if (current !== this._draftTemplate) {
          this._templateEditor.dispatch({
            changes: { from: 0, to: current.length, insert: this._draftTemplate },
          })
        }
      }
    } finally {
      this._syncingEditors = false
    }
  }

  private async loadImports(): Promise<void> {
    try {
      const required = ['button', 'icon', 'split-panel', 'details']
      const explicit = this.parseImportList(this._draftImports)
      const autoDetected = this.detectWebAwesomeComponents(this._draftTemplate)
      const componentNames = new Set<string>([...required, ...explicit, ...autoDetected])
      const modulesToLoad = [...componentNames].filter((name) => !this._loadedModules.has(name))

      await Promise.all(
        modulesToLoad.map(async (componentName) => {
          await import(this.getWebAwesomeComponentUrl(componentName))
          this._loadedModules.add(componentName)
        }),
      )
    } catch (e) {
      console.warn('Failed to load imports:', e)
    }
  }

  private getWebAwesomeComponentUrl(componentName: string): string {
    const loaderScript = document.querySelector<HTMLScriptElement>('script[data-webawesome]')
    const assetBasePath = loaderScript?.dataset.webawesome?.replace(/\/$/, '') || '/lib/webawesome/dist-cdn'
    return `${assetBasePath}/components/${componentName}/${componentName}.js`
  }

  private parseImportList(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        return []
      }
      return parsed.filter((item): item is string => typeof item === 'string')
    } catch {
      return []
    }
  }

  private detectWebAwesomeComponents(markup: string): string[] {
    const componentNames = new Set<string>()
    const matches = markup.matchAll(/<\s*wa-([a-z0-9-]+)/gi)
    for (const match of matches) {
      const componentName = match[1]
      if (componentName) {
        componentNames.add(componentName)
      }
    }
    return [...componentNames]
  }

  private runDemo(): void {
    if (!this.canEdit) {
      return
    }
    if (this._jsonEditor) {
      this._draftData = this._jsonEditor.state.doc.toString()
    }
    if (this._templateEditor) {
      this._draftTemplate = this._templateEditor.state.doc.toString()
    }
    this.processData()
  }

  private formatInitialDrafts(): void {
    if (this._didFormatInitialContent) {
      return
    }

    const parsed = parseJSON(this._draftData)
    if (parsed) {
      this._draftData = JSON.stringify(parsed, null, 2)
    }

    this._draftTemplate = formatHtmlTemplate(this._draftTemplate)
    this._didFormatInitialContent = true
  }

  private resetDemo(): void {
    if (!this.canEdit) {
      return
    }
    this._draftData = this.data
    this._draftTemplate = this.template
    this._draftImports = this.imports

    const parsed = parseJSON(this._draftData)
    if (parsed) {
      this._draftData = JSON.stringify(parsed, null, 2)
    }
    this._draftTemplate = formatHtmlTemplate(this._draftTemplate)

    this.syncEditorsFromDraft()
    this.updateEditorHighlighting()
    this.processData()
  }

  private formatJson(): void {
    if (!this.canEdit) {
      return
    }
    if (this._jsonEditor) {
      this._draftData = this._jsonEditor.state.doc.toString()
    }
    const parsed = parseJSON(this._draftData)
    if (!parsed) {
      this._error = 'Invalid JSON data'
      return
    }
    this._draftData = JSON.stringify(parsed, null, 2)
    this.syncEditorsFromDraft()
    this.updateEditorHighlighting()
    this.processData()
  }

  private formatHtml(): void {
    if (!this.canEdit) {
      return
    }
    if (this._templateEditor) {
      this._draftTemplate = this._templateEditor.state.doc.toString()
    }
    this._draftTemplate = formatHtmlTemplate(this._draftTemplate)
    this.syncEditorsFromDraft()
    this.updateEditorHighlighting()
    this.processData()
  }

  private renderEditor(): unknown {
    if (!this.canEdit) {
      return null
    }

    const dataLabel = this.dataLabel.trim()
    const templateLabel = this.templateLabel.trim()
    const editorContentStyle = `--demo-editor-height: ${this._editorHeight}px`

    return html`
      <wa-details
        class="editor-panel"
        appearance="plain"
        ?open="${this.editorOpen}"
        @wa-show="${() => (this.editorOpen = true)}"
        @wa-hide="${() => (this.editorOpen = false)}"
      >
        <span slot="summary">Data & template</span>
        <div class="editor-panel-content" style="${editorContentStyle}">
          <wa-split-panel
            class="editor-split"
            position="50"
            ?vertical="${this._isCompact}"
            @pointerdown="${this.handleEditorEdgeResizeStart}"
          >
            <label class="editor-field" slot="start">
              ${dataLabel
                ? html`
                  <span>${dataLabel}</span>
                `
                : null}
              <div id="json-editor" class="editor-host"></div>
            </label>

            <label class="editor-field" slot="end">
              ${templateLabel
                ? html`
                  <span>${templateLabel}</span>
                `
                : null}
              <div id="template-editor" class="editor-host"></div>
            </label>
          </wa-split-panel>
          <div class="editor-actions">
            <wa-button
              size="small"
              variant="brand"
              appearance="plain"
              aria-label="Run demo"
              title="Run demo"
              @click="${this.runDemo}"
            >
              <wa-icon name="play" label="Run demo"></wa-icon>
            </wa-button>
            <wa-button
              size="small"
              variant="neutral"
              appearance="plain"
              aria-label="Format JSON"
              title="Format JSON"
              @click="${this.formatJson}"
            >
              <wa-icon name="code" label="Format JSON"></wa-icon>
            </wa-button>
            <wa-button
              size="small"
              variant="neutral"
              appearance="plain"
              aria-label="Format HTML"
              title="Format HTML"
              @click="${this.formatHtml}"
            >
              <wa-icon name="file-code" label="Format HTML"></wa-icon>
            </wa-button>
            <wa-button
              size="small"
              variant="neutral"
              appearance="plain"
              aria-label="Reset demo"
              title="Reset demo"
              @click="${this.resetDemo}"
            >
              <wa-icon name="arrows-rotate" label="Reset demo"></wa-icon>
            </wa-button>
          </div>
          <div
            class="editor-resizer ${this._isResizingEditors ? 'is-active' : ''}"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editors"
            @pointerdown="${this.handleEditorResizeStart}"
          >
          </div>
        </div>
      </wa-details>
    `
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

  private renderPane(
    content: string,
    type: 'json' | 'html',
    buttonId: string,
    copyTextOverride?: string,
  ): unknown {
    const copyText = copyTextOverride ?? (type === 'json' ? this.data : this._renderedHtml)
    return html`
      <div class="pane">
        <div class="pane-toolbar">
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

  private getFormattedJsonSource(): string {
    const parsed = parseJSON(this._draftData)
    if (!parsed) {
      return this._draftData
    }
    return JSON.stringify(parsed, null, 2)
  }

  private renderCodeMirrorPane(
    source: string,
    language: 'json' | 'html',
  ): unknown {
    return html`
      <code-example .code="${source}" .language="${language}"></code-example>
    `
  }

  private renderOutputPane(options: { includeResizer?: boolean } = {}): unknown {
    const includeResizer = options.includeResizer ?? false
    const outputContainerStyle = this.outputBackground.trim() ? `--demo-output-bg: ${this.outputBackground};` : ''

    return html`
      <div class="pane">
        <div class="pane-content">
          ${this._error
            ? html`
              <div class="error">${this._error}</div>
            `
            : html`
              <div class="output-container" style="${outputContainerStyle}" data-version="${this._outputVersion}">
                ${this._renderedTemplate}
              </div>
            `}
        </div>
        ${includeResizer
          ? html`
            <div
              class="preview-resizer ${this._isResizingPreview ? 'is-active' : ''}"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize rendered output"
              @pointerdown="${this.handlePreviewResizeStart}"
            >
            </div>
          `
          : null}
      </div>
    `
  }

  private renderTabs(): unknown {
    const tabs: Array<{ key: 'data' | 'markup' | 'output'; label: string }> = [
      { key: 'data', label: 'Data' },
      { key: 'markup', label: 'Template' },
      { key: 'output', label: 'Output' },
    ]

    let tabContent: unknown = this.renderOutputPane()
    if (this._activeTab === 'data') {
      tabContent = this.renderPane(this._highlightedJson, 'json', 'copy-json')
    } else if (this._activeTab === 'markup') {
      tabContent = this.renderPane(this._highlightedTemplate, 'html', 'copy-html', this._draftTemplate)
    }

    return html`
      <div class="tabs-toolbar" role="tablist" aria-label="Demo pane sections">
        ${tabs.map((tab) =>
          html`
            <button
              class="tab-btn ${this._activeTab === tab.key ? 'is-active' : ''}"
              role="tab"
              aria-selected="${this._activeTab === tab.key}"
              @click="${() => (this._activeTab = tab.key)}"
            >
              ${tab.label}
            </button>
          `
        )}
      </div>
      ${tabContent}
    `
  }

  private renderEditablePreview(): unknown {
    return html`
      <div class="editable-layout" style="--demo-preview-height: ${this._previewHeight}px;">
        ${this.renderEditor()}
        <div class="editable-preview">${this.renderOutputPane({ includeResizer: true })}</div>
      </div>
    `
  }

  private renderReadOnlyEditor(): unknown {
    const dataLabel = this.dataLabel.trim() || 'Data'
    const templateLabel = this.templateLabel.trim() || 'Template'
    const formattedJson = this.getFormattedJsonSource()
    const editorContentStyle = `--demo-editor-height: ${this._editorHeight}px`

    return html`
      <wa-details class="editor-panel" appearance="plain" open>
        <span slot="summary">Data & template</span>
        <div class="editor-panel-content" style="${editorContentStyle}">
          <wa-split-panel
            class="editor-split"
            position="50"
            ?vertical="${this._isCompact}"
            @pointerdown="${this.handleEditorEdgeResizeStart}"
          >
            <section class="editor-field" slot="start">
              <span>${dataLabel}</span>
              ${this.renderCodeMirrorPane(formattedJson, 'json')}
            </section>
            <section class="editor-field" slot="end">
              <span>${templateLabel}</span>
              ${this.renderCodeMirrorPane(this._draftTemplate, 'html')}
            </section>
          </wa-split-panel>
          <div
            class="editor-resizer ${this._isResizingEditors ? 'is-active' : ''}"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editors"
            @pointerdown="${this.handleEditorResizeStart}"
          >
          </div>
        </div>
      </wa-details>
    `
  }

  private renderReadOnlyPreview(): unknown {
    return html`
      <div class="editable-layout" style="--demo-preview-height: ${this._previewHeight}px;">
        ${this.renderReadOnlyEditor()}
        <div class="editable-preview">${this.renderOutputPane({ includeResizer: true })}</div>
      </div>
    `
  }

  protected override render(): unknown {
    if (this._error && !this._parsedData) {
      return html`
        <div class="error">${this._error}</div>
      `
    }

    if (this.canEdit) {
      return this.renderEditablePreview()
    }
    return this.renderReadOnlyPreview()
  }
}

if (!customElements.get('demo-pane')) {
  customElements.define('demo-pane', DemoPane)
}

export { DemoPane }
