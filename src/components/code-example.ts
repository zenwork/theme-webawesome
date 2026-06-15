import { css, html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { css as cssLanguage } from '@codemirror/lang-css'
import { html as htmlLanguage } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { json as jsonLanguage } from '@codemirror/lang-json'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'

export const codeExampleLanguages = ['json', 'html', 'javascript', 'typescript', 'jsx', 'tsx', 'css', 'text'] as const

export type CodeExampleLanguage = typeof codeExampleLanguages[number]

type HighlightedCodeExampleLanguage = Exclude<CodeExampleLanguage, 'text'>
type MeasuredEditorView = EditorView & { readonly contentHeight?: number }

const languageAliases = {
  css: 'css',
  html: 'html',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  markup: 'html',
  plaintext: 'text',
  text: 'text',
  ts: 'typescript',
  tsx: 'tsx',
  txt: 'text',
  typescript: 'typescript',
} as const satisfies Record<string, CodeExampleLanguage>

const languageExtensions = {
  css: () => cssLanguage(),
  html: () => htmlLanguage(),
  javascript: () => javascript(),
  json: () => jsonLanguage(),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  typescript: () => javascript({ typescript: true }),
} satisfies Record<HighlightedCodeExampleLanguage, () => Extension>

const interpolationAttributeValuePattern = /^(?:\{[\s\S]*\}|\$\{[\s\S]*\})$/

export function normalizeLanguage(value?: string | null): CodeExampleLanguage | null {
  if (!value) {
    return null
  }
  const normalized = value.trim().toLowerCase()
  return languageAliases[normalized as keyof typeof languageAliases] ?? null
}

export function normalizeCode(source: string): string {
  const lines = source.replaceAll('\r\n', '\n').split('\n')
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

export function withOneLinePadding(source: string): string {
  const code = normalizeCode(source)
  return code ? `\n${code}\n` : ''
}

export function inferLanguageFromSlottedContent(
  firstElement: Element | undefined,
  hasElementNode: boolean,
): CodeExampleLanguage {
  const explicit = firstElement?.getAttribute('data-language') || firstElement?.getAttribute('language')
  const normalizedExplicit = normalizeLanguage(explicit)
  if (normalizedExplicit) {
    return normalizedExplicit
  }

  const codeElement = firstElement?.matches('code') ? firstElement : firstElement?.querySelector('code')
  const className = typeof codeElement?.className === 'string' ? codeElement.className : ''
  const classHint = className.match(/(?:^|\s)language-([a-z0-9-]+)(?:\s|$)/i)?.[1]
  const normalizedClassHint = normalizeLanguage(classHint)
  if (normalizedClassHint) {
    return normalizedClassHint
  }

  return hasElementNode ? 'html' : 'text'
}

function escapeAttributeValue(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

function getSerializedAttribute(attribute: Attr): string {
  const { name, value } = attribute
  if (interpolationAttributeValuePattern.test(value)) {
    return `${name}=${value}`
  }
  return value === '' ? name : `${name}="${escapeAttributeValue(value)}"`
}

function getSerializedNodeSource(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return `<!--${node.textContent ?? ''}-->`
  }

  if (!(node instanceof Element)) {
    return node.textContent ?? ''
  }

  const tagName = node.tagName.toLowerCase()
  const attributes = Array.from(node.attributes).map(getSerializedAttribute).join(' ')
  const openTag = attributes ? `<${tagName} ${attributes}>` : `<${tagName}>`
  const children = Array.from(node.childNodes).map(getSerializedNodeSource).join('')
  return `${openTag}${children}</${tagName}>`
}

export class CodeExample extends LitElement {
  static override styles = css`
    :host {
      --code-example-border-color: var(--docs-color-divider, var(--wa-color-neutral-200));
      --code-example-surface-bg: var(--docs-color-surface, var(--wa-color-neutral-0));
      display: block;
      margin-block-end: 0.875rem;
      border: 1px solid var(--code-example-border-color);
      border-radius: var(--wa-border-radius-s);
      overflow: hidden;
      background: var(--code-example-surface-bg);
    }

    :host(:last-child) {
      margin-block-end: 0;
    }

    #editor {
      min-height: 64px;
    }

    .cm-editor {
      font-size: var(--wa-font-size-xs);
      line-height: 1.45;
    }

    .cm-scroller {
      font-family: var(--wa-font-family-code);
      line-height: 1.4;
    }
  `

  @property({ type: String })
  code = ''

  @property({ type: String })
  language: CodeExampleLanguage = 'text'

  @property({ type: Boolean, attribute: 'no-line-numbers' })
  noLineNumbers = false

  @property({ type: Boolean })
  padded = false

  private _editor: EditorView | null = null
  private _codeCameFromSlot = false
  private _slottedCodeValue: string | null = null
  private _hasInitializedLightDom = false

  get contentHeight(): number {
    const editor = this._editor
    if (!editor) {
      return 0
    }
    const contentDOMHeight = Math.max(
      Math.ceil(editor.contentDOM.getBoundingClientRect().height),
      editor.contentDOM.scrollHeight,
    )
    if (contentDOMHeight > 0) {
      return contentDOMHeight
    }
    const measured = (editor as MeasuredEditorView).contentHeight
    if (typeof measured === 'number' && measured > 0) {
      return measured
    }
    return editor.scrollDOM.scrollHeight
  }

  get contentDOM(): HTMLElement | null {
    return this._editor?.contentDOM ?? null
  }

  get displayCode(): string {
    return this.padded ? withOneLinePadding(this.code) : this.code
  }

  get lineNumbers(): boolean {
    return !this.noLineNumbers
  }

  set lineNumbers(value: boolean) {
    this.noLineNumbers = !value
  }

  override disconnectedCallback(): void {
    this._editor?.destroy()
    this._editor = null
    super.disconnectedCallback()
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (this._hasInitializedLightDom) {
      return
    }
    this._hasInitializedLightDom = true
    if (!this.code) {
      this.setCodeFromSlot()
    }
    this.applyInferredLanguage()
  }

  protected override firstUpdated(): void {
    this.mountEditor()
  }

  protected override updated(changed: Map<string, unknown>): void {
    if (!this._editor) {
      return
    }

    if (changed.has('code') && this.code !== this._slottedCodeValue) {
      this._codeCameFromSlot = false
      this._slottedCodeValue = null
    }

    if (changed.has('code') || changed.has('padded')) {
      const current = this._editor.state.doc.toString()
      const next = this.displayCode
      if (current !== next) {
        this._editor.dispatch({
          changes: { from: 0, to: current.length, insert: next },
        })
      }
    }

    if (changed.has('language') || changed.has('noLineNumbers')) {
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

    const extensions: Extension[] = [
      oneDark,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      EditorView.editable.of(false),
    ]
    if (!this.noLineNumbers) {
      extensions.unshift(lineNumbers())
    }
    const language = this.getLanguageExtension()
    if (language) {
      extensions.push(language)
    }

    const state = EditorState.create({
      doc: this.displayCode,
      extensions,
    })

    this._editor = new EditorView({
      state,
      parent,
    })
  }

  private handleSlotChange = (): void => {
    if (this.hasAttribute('code') || (this.code && !this._codeCameFromSlot)) {
      return
    }
    this.setCodeFromSlot()
    this.applyInferredLanguage()
  }

  private setCodeFromSlot(): void {
    const code = this.getNormalizedSlottedCode()
    this._slottedCodeValue = code
    this._codeCameFromSlot = true
    this.code = code
  }

  private getNormalizedSlottedCode(): string {
    const assigned = Array.from(this.childNodes)
    const hasElementNode = assigned.some((node) => node.nodeType === Node.ELEMENT_NODE)
    const raw = hasElementNode
      ? assigned.map(getSerializedNodeSource).join('')
      : assigned.map((node) => node.textContent ?? '').join('') || this.textContent || ''

    return normalizeCode(raw)
  }

  private applyInferredLanguage(): void {
    if (this.hasAttribute('language')) {
      return
    }
    if (this.language !== 'text') {
      return
    }
    this.language = this.inferLanguageFromSlot()
  }

  private inferLanguageFromSlot(): CodeExampleLanguage {
    const firstElement = this.firstElementChild ?? undefined
    const hasElementNode = Array.from(this.childNodes).some((node) => node.nodeType === Node.ELEMENT_NODE)
    return inferLanguageFromSlottedContent(firstElement, hasElementNode)
  }

  private getLanguageExtension(): Extension | null {
    if (this.language === 'text') {
      return null
    }
    return languageExtensions[this.language]()
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
