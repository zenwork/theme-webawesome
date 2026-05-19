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

  @property({ type: Boolean, attribute: 'fit-content', reflect: true })
  fitContent = false

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
  private _hasManualEditorHeight = false
  private _editorResizeStartY = 0
  private _editorResizeStartHeight = 180
  private _editorMinHeight = 120
  private _previewResizeStartY = 0
  private _previewResizeStartHeight = 320
  private _fitContentReflowTimeout: number | null = null
  private _contentResizeObserver: ResizeObserver | null = null
  private readonly _observedContentDOMs = new WeakSet<Element>()
  private readonly _editorContentPadding = 8

  override connectedCallback(): void {
    super.connectedCallback()
    this._activeTab = this.defaultTab
    this._mediaQuery = globalThis.matchMedia('(max-width: 768px)')
    this._isCompact = this._mediaQuery.matches
    this._mediaQuery.addEventListener('change', this.handleMediaChange)
    globalThis.addEventListener('resize', this.handleViewportResize)
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
    if (this._fitContentReflowTimeout !== null) {
      globalThis.clearTimeout(this._fitContentReflowTimeout)
      this._fitContentReflowTimeout = null
    }
    globalThis.removeEventListener('resize', this.handleViewportResize)
    globalThis.removeEventListener('pointermove', this.handleEditorResizeMove)
    globalThis.removeEventListener('pointerup', this.handleEditorResizeEnd)
    globalThis.removeEventListener('pointercancel', this.handleEditorResizeEnd)
    globalThis.removeEventListener('pointermove', this.handlePreviewResizeMove)
    globalThis.removeEventListener('pointerup', this.handlePreviewResizeEnd)
    globalThis.removeEventListener('pointercancel', this.handlePreviewResizeEnd)
    this._contentResizeObserver?.disconnect()
    this._contentResizeObserver = null
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
      this.requestFitContentReflow()
    }
  }

  private handleMediaChange = (event: MediaQueryListEvent): void => {
    this._isCompact = event.matches
  }

  private handleViewportResize = (): void => {
    if (!this.shouldAutoSizeEditors) {
      return
    }
    this.requestUpdate()
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
      this.requestFitContentReflow()
    }
    if (this.shouldAutoSizeEditors) {
      this.requestFitContentReflow()
      this.setupContentObservers()
    }
  }

  private setupContentObservers(): void {
    if (!this.shouldAutoSizeEditors || !this.renderRoot) return

    if (!this._contentResizeObserver) {
      this._contentResizeObserver = new ResizeObserver(() => {
        this.requestFitContentReflow()
      })
    }

    if (this.canEdit) {
      if (this._jsonEditor && !this._observedContentDOMs.has(this._jsonEditor.contentDOM)) {
        this._contentResizeObserver.observe(this._jsonEditor.contentDOM)
        this._observedContentDOMs.add(this._jsonEditor.contentDOM)
      }
      if (this._templateEditor && !this._observedContentDOMs.has(this._templateEditor.contentDOM)) {
        this._contentResizeObserver.observe(this._templateEditor.contentDOM)
        this._observedContentDOMs.add(this._templateEditor.contentDOM)
      }
    } else {
      const examples = this.renderRoot.querySelectorAll('code-example') as NodeListOf<
        HTMLElement & { contentDOM?: HTMLElement }
      >
      for (const example of examples) {
        const contentDOM = example.contentDOM
        if (contentDOM && !this._observedContentDOMs.has(contentDOM)) {
          this._contentResizeObserver.observe(contentDOM)
          this._observedContentDOMs.add(contentDOM)
        }
      }
    }
  }

  private get canEdit(): boolean {
    return this.editable && !this.readOnly
  }

  private get shouldAutoSizeEditors(): boolean {
    return this.fitContent || !this._hasManualEditorHeight
  }

  private parseDraftData(): { parsed: TemplateData | null; error: string | null } {
    const source = this._draftData.trim()
    if (!source) {
      return {
        parsed: null,
        error: 'Data is empty. Provide a JSON object like {"key":"value"}.',
      }
    }

    try {
      const parsed = JSON.parse(source)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        const kind = Array.isArray(parsed) ? 'array' : parsed === null ? 'null' : typeof parsed
        return {
          parsed: null,
          error: `Data must be a JSON object. Received ${kind}.`,
        }
      }
      return { parsed: parsed as TemplateData, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        parsed: null,
        error: `JSON parse error: ${message}`,
      }
    }
  }

  private formatTemplateError(error: unknown): string {
    if (error instanceof Error && error.message) {
      return `Template error: ${error.message}`
    }
    return `Template error: ${String(error)}`
  }

  private processData(): void {
    this._error = null
    this._parsedData = null
    this._renderedTemplate = null
    this._renderedHtml = ''

    const { parsed, error } = this.parseDraftData()
    if (!parsed) {
      this._error = error ?? 'Invalid JSON data'
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
      this._error = this.formatTemplateError(e)
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
        this.requestFitContentReflow()
      })
    }

    if (!this._templateEditor) {
      this._templateEditor = this.createEditor(templateHost, this._draftTemplate, htmlLanguage(), (value) => {
        if (this._syncingEditors) return
        this._draftTemplate = value
        this.updateEditorHighlighting()
        this.requestFitContentReflow()
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
          if (update.heightChanged) {
            this.requestFitContentReflow()
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
    const panelContent = this.shadowRoot?.querySelector<HTMLElement>('.editor-panel-content')
    this._editorMinHeight = this.getMinimumEditorPanelHeight(panelContent)
    const measuredHeight = panelContent ? Math.round(panelContent.getBoundingClientRect().height) : this._editorHeight
    this._editorHeight = Math.max(this._editorMinHeight, Math.min(640, measuredHeight))
    this._hasManualEditorHeight = true
    if (this.fitContent) {
      this.fitContent = false
    }
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
    const nextHeight = Math.max(this._editorMinHeight, Math.min(640, this._editorResizeStartHeight + deltaY))
    if (nextHeight === this._editorHeight) {
      return
    }
    this._editorHeight = nextHeight
    const nextHeightCss = `${this._editorHeight}px`
    for (const panel of this.renderRoot.querySelectorAll<HTMLElement>('.editor-panel-content')) {
      panel.style.setProperty('--demo-editor-height', nextHeightCss)
    }
    this.requestUpdate()
    this.refreshEditorLayout()
  }

  private getMinimumEditorPanelHeight(panelContent?: HTMLElement | null): number {
    const panel = panelContent ?? this.renderRoot.querySelector<HTMLElement>('.editor-panel-content')
    if (!panel) {
      return this.canEdit ? 207 : 175
    }

    const panelStyles = globalThis.getComputedStyle(panel)
    const paddingTop = this.readPx(panelStyles.paddingTop)
    const paddingBottom = this.readPx(panelStyles.paddingBottom)
    const rowGap = this.readPx(panelStyles.rowGap || panelStyles.gap)

    const split = panel.querySelector<HTMLElement>('.editor-split')
    const splitStyles = split ? globalThis.getComputedStyle(split) : null
    const splitMin = splitStyles ? this.readPx(splitStyles.minBlockSize) || this.readPx(splitStyles.minHeight) : 120

    const actions = panel.querySelector<HTMLElement>('.editor-actions')
    const measuredActionsHeight = actions ? Math.max(0, Math.ceil(actions.getBoundingClientRect().height)) : 0
    const actionsHeight = this.canEdit ? Math.max(32, measuredActionsHeight) : measuredActionsHeight

    const resizer = panel.querySelector<HTMLElement>('.editor-resizer')
    const resizerHeight = resizer ? Math.max(13, Math.ceil(resizer.getBoundingClientRect().height)) : 13

    // The grid defines three rows (editor, actions, resizer), which means two row gaps.
    const minimumHeight = splitMin + actionsHeight + resizerHeight + paddingTop + paddingBottom + rowGap * 2
    const minCap = this.shouldAutoSizeEditors ? 0 : 120
    return Math.max(minCap, Math.ceil(minimumHeight))
  }

  private readPx(value: string | null | undefined): number {
    const parsed = Number.parseFloat(value ?? '')
    return Number.isFinite(parsed) ? parsed : 0
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

  private requestFitContentReflow(): void {
    if (!this.shouldAutoSizeEditors) {
      return
    }
    const scheduleReflow = (): void => {
      if (!this.isConnected || !this.shouldAutoSizeEditors) {
        return
      }
      this.syncFitContentPanelHeight()
    }

    scheduleReflow()
    requestAnimationFrame(scheduleReflow)

    if (this._fitContentReflowTimeout !== null) {
      globalThis.clearTimeout(this._fitContentReflowTimeout)
    }
    this._fitContentReflowTimeout = globalThis.setTimeout(() => {
      this._fitContentReflowTimeout = null
      scheduleReflow()
    }, 120)
  }

  private syncFitContentPanelHeight(): void {
    const panel = this.renderRoot.querySelector<HTMLElement>('.editor-panel-content')
    if (!panel) {
      return
    }
    const desiredHeight = `${this.getFitContentEditorHeight()}px`
    if (panel.style.getPropertyValue('--demo-editor-height') === desiredHeight) {
      return
    }
    panel.style.setProperty('--demo-editor-height', desiredHeight)
    this.refreshEditorLayout()
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

    this._draftTemplate = formatHtmlTemplate(this._draftTemplate, {
      maxLineLength: this.getTemplateFormatLineLength(),
    })
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
    this._draftTemplate = formatHtmlTemplate(this._draftTemplate, {
      maxLineLength: this.getTemplateFormatLineLength(),
    })

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
    const { parsed, error } = this.parseDraftData()
    if (!parsed) {
      this._error = error ?? 'Invalid JSON data'
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
    this._draftTemplate = formatHtmlTemplate(this._draftTemplate, {
      maxLineLength: this.getTemplateFormatLineLength(),
    })
    this.syncEditorsFromDraft()
    this.updateEditorHighlighting()
    this.processData()
  }

  private getFitContentEditorHeight(): number {
    const panel = this.renderRoot.querySelector<HTMLElement>('.editor-panel-content')
    const dataMeasured = this.measureEditorContentHeight('data')
    const templateMeasured = this.measureEditorContentHeight('template')
    const measuredContent = Math.max(dataMeasured, templateMeasured)

    const splitMin = this.readSplitMinHeight(panel)
    const overhead = this.getEditorPanelOverhead(panel)
    const panelMin = this.getMinimumEditorPanelHeight(panel)

    let desiredEditorArea: number
    if (measuredContent > 0) {
      desiredEditorArea = Math.max(splitMin, measuredContent + this._editorContentPadding)
    } else {
      // Editors have not finished mounting yet — estimate from raw line counts so the
      // panel does not collapse before the measured pass replaces this value.
      const dataSource = this.canEdit ? this._draftData : this.getFormattedJsonSource()
      const templateSource = this.canEdit
        ? this._draftTemplate
        : this.getFormattedTemplateForSizing(this._draftTemplate)
      const dataLineCount = Math.max(1, dataSource.split('\n').length)
      const templateLineCount = Math.max(1, templateSource.split('\n').length)
      const maxLineCount = Math.max(dataLineCount, templateLineCount)
      const estimated = maxLineCount * 18 + 16
      desiredEditorArea = Math.max(splitMin, estimated)
    }

    const preferred = Math.round(desiredEditorArea + overhead)
    return Math.max(panelMin, Math.min(640, preferred))
  }

  private measureEditorContentHeight(which: 'data' | 'template'): number {
    if (this.canEdit) {
      const editor = which === 'data' ? this._jsonEditor : this._templateEditor
      if (!editor) {
        return 0
      }
      const editorHost = editor.dom.parentElement instanceof HTMLElement ? editor.dom.parentElement : editor.dom
      // @ts-ignore: contentHeight is a valid property of EditorView in CM6
      const reported = editor.contentHeight
      const fallback = Math.max(
        typeof reported === 'number' ? reported : 0,
        editor.scrollDOM.scrollHeight,
      )
      const contentHeight = this.getElementContentHeight(editor.contentDOM, fallback)
      return this.getEditorFieldRequiredHeight(editorHost, editorHost, contentHeight)
    }
    const selector = which === 'data'
      ? '.editor-field[slot="start"] code-example'
      : '.editor-field[slot="end"] code-example'
    const codeExample = this.renderRoot.querySelector<HTMLElement & { contentHeight?: number }>(selector)
    if (!codeExample) {
      return 0
    }
    const contentDOM = 'contentDOM' in codeExample && codeExample.contentDOM instanceof HTMLElement
      ? codeExample.contentDOM
      : null
    const fallback = Math.max(
      typeof codeExample.contentHeight === 'number' ? codeExample.contentHeight : 0,
      codeExample.scrollHeight,
    )
    const contentHeight = this.getElementContentHeight(contentDOM, fallback)
    return this.getEditorFieldRequiredHeight(codeExample, codeExample, contentHeight)
  }

  private getElementContentHeight(element: HTMLElement | null, fallback = 0): number {
    if (!element) {
      return fallback
    }
    return Math.max(
      fallback,
      Math.ceil(element.getBoundingClientRect().height),
      element.scrollHeight,
    )
  }

  private getEditorFieldRequiredHeight(
    contentHost: HTMLElement,
    fieldContent: HTMLElement,
    contentHeight: number,
  ): number {
    const field = contentHost.closest<HTMLElement>('.editor-field')
    const fieldChrome = field ? this.getEditorFieldChromeHeight(field, fieldContent) : 0
    return contentHeight + this.getVerticalBorderSize(contentHost) + fieldChrome
  }

  private getEditorFieldChromeHeight(field: HTMLElement, fieldContent: HTMLElement): number {
    const extraRows = [...field.children].filter((child): child is HTMLElement =>
      child instanceof HTMLElement && child !== fieldContent && child.getBoundingClientRect().height > 0
    )
    if (extraRows.length === 0) {
      return 0
    }
    const rowsHeight = extraRows.reduce((total, child) => total + Math.ceil(child.getBoundingClientRect().height), 0)
    const fieldStyles = globalThis.getComputedStyle(field)
    return rowsHeight + this.readPx(fieldStyles.rowGap || fieldStyles.gap)
  }

  private getVerticalBorderSize(element: HTMLElement): number {
    const styles = globalThis.getComputedStyle(element)
    return this.readPx(styles.borderTopWidth) + this.readPx(styles.borderBottomWidth)
  }

  private readSplitMinHeight(panel: HTMLElement | null): number {
    const split = panel?.querySelector<HTMLElement>('.editor-split') ??
      this.renderRoot.querySelector<HTMLElement>('.editor-split')
    if (!split) {
      return this.shouldAutoSizeEditors ? 0 : 120
    }
    const styles = globalThis.getComputedStyle(split)
    const measured = this.readPx(styles.minBlockSize) || this.readPx(styles.minHeight)
    return measured
  }

  private getEditorPanelOverhead(panel: HTMLElement | null): number {
    const target = panel ?? this.renderRoot.querySelector<HTMLElement>('.editor-panel-content')
    if (!target) {
      return this.canEdit ? 95 : 63
    }
    const panelStyles = globalThis.getComputedStyle(target)
    const paddingTop = this.readPx(panelStyles.paddingTop)
    const paddingBottom = this.readPx(panelStyles.paddingBottom)
    const rowGap = this.readPx(panelStyles.rowGap || panelStyles.gap)

    const actions = target.querySelector<HTMLElement>('.editor-actions')
    const measuredActionsHeight = actions ? Math.max(0, Math.ceil(actions.getBoundingClientRect().height)) : 0
    const actionsHeight = this.canEdit ? Math.max(32, measuredActionsHeight) : measuredActionsHeight

    const resizer = target.querySelector<HTMLElement>('.editor-resizer')
    const resizerHeight = resizer ? Math.max(13, Math.ceil(resizer.getBoundingClientRect().height)) : 13

    return paddingTop + paddingBottom + rowGap * 2 + actionsHeight + resizerHeight
  }

  private getFormattedTemplateForSizing(template: string): string {
    try {
      return formatHtmlTemplate(template, {
        maxLineLength: this.getTemplateFormatLineLength(),
      })
    } catch {
      return template
    }
  }

  private getTemplateFormatLineLength(): number {
    if (this._templateEditor) {
      const viewportWidth = this._templateEditor.scrollDOM.clientWidth || this._templateEditor.dom.clientWidth
      const charWidth = Math.max(6, this._templateEditor.defaultCharacterWidth || 8)
      const chars = Math.floor((viewportWidth - 24) / charWidth)
      return Math.max(48, Math.min(140, chars))
    }

    const fallbackWidth = this.renderRoot.querySelector<HTMLElement>('#template-editor')?.clientWidth ??
      this.renderRoot.querySelector<HTMLElement>('.editor-field[slot="end"]')?.clientWidth

    if (fallbackWidth && Number.isFinite(fallbackWidth)) {
      const chars = Math.floor((fallbackWidth - 24) / 8)
      return Math.max(48, Math.min(140, chars))
    }

    return 80
  }

  private renderEditor(): unknown {
    if (!this.canEdit) {
      return null
    }

    const dataLabel = this.dataLabel.trim()
    const templateLabel = this.templateLabel.trim()
    const editorHeight = this.shouldAutoSizeEditors ? this.getFitContentEditorHeight() : this._editorHeight
    const editorContentStyle = `--demo-editor-height: ${editorHeight}px; --demo-editor-min-height: ${
      this.shouldAutoSizeEditors ? 0 : 120
    }px`

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
    const previewStyle = `--demo-preview-height: ${this._previewHeight}px;`
    return html`
      <div class="editable-layout" style="${previewStyle}">
        ${this.renderEditor()}
        <div class="editable-preview">${this.renderOutputPane({ includeResizer: true })}</div>
      </div>
    `
  }

  private renderReadOnlyEditor(): unknown {
    const dataLabel = this.dataLabel.trim() || 'Data'
    const templateLabel = this.templateLabel.trim() || 'Template'
    const formattedJson = this.getFormattedJsonSource()
    const formattedTemplate = this.getFormattedTemplateForSizing(this._draftTemplate)
    const editorHeight = this.shouldAutoSizeEditors ? this.getFitContentEditorHeight() : this._editorHeight
    const editorContentStyle = `--demo-editor-height: ${editorHeight}px; --demo-editor-min-height: ${
      this.shouldAutoSizeEditors ? 0 : 120
    }px`

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
              ${this.renderCodeMirrorPane(formattedTemplate, 'html')}
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
    const previewStyle = `--demo-preview-height: ${this._previewHeight}px;`
    return html`
      <div class="editable-layout" style="${previewStyle}">
        ${this.renderReadOnlyEditor()}
        <div class="editable-preview">${this.renderOutputPane({ includeResizer: true })}</div>
      </div>
    `
  }

  protected override render(): unknown {
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
