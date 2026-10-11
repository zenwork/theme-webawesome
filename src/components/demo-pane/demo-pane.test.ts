import { afterEach, describe, expect, it, vi } from 'vitest'
import './demo-pane.ts'
import { formatHtmlTemplate } from './template-renderer.ts'
import { styles } from './styles.ts'

type FileHandle = {
  getFile: () => Promise<{ text: () => Promise<string> }>
  createWritable: () => Promise<{ write: (contents: string) => Promise<void>; close: () => Promise<void> }>
}

type EditorViewLike = {
  state: { doc: { length: number; toString(): string } }
  dispatch: (transaction: { changes: { from: number; to: number; insert: string } }) => void
}

type DemoPaneElement = HTMLElement & {
  data: string
  template: string
  editorOpen: boolean
  fileAccess: boolean
  updateComplete: Promise<boolean>
  _draftData: string
  _draftTemplate: string
  _dataFileHandle: FileHandle | null
  _templateFileHandle: FileHandle | null
  _jsonEditor: EditorViewLike | null
  _templateEditor: EditorViewLike | null
}

const initialData = '{"patient":{"resourceType":"Patient"}}'
const initialTemplate = '<p>${patient.resourceType}</p>'
const formattedInitialData = JSON.stringify(JSON.parse(initialData), null, 2)
const formattedInitialTemplate = formatHtmlTemplate(initialTemplate)

function createFileHandle(contents: string): FileHandle {
  return {
    getFile: () => Promise.resolve({ text: () => Promise.resolve(contents) }),
    createWritable: () =>
      Promise.resolve({
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
      }),
  }
}

function createWritableFileHandle(contents: string, failure?: 'write' | 'close') {
  const writable = {
    write: failure === 'write' ? vi.fn(() => Promise.reject(new Error('Disk full'))) : vi.fn(() => Promise.resolve()),
    close: failure === 'close'
      ? vi.fn(() => Promise.reject(new Error('Close failed')))
      : vi.fn(() => Promise.resolve()),
    abort: vi.fn(() => Promise.resolve()),
  }
  const handle: FileHandle = {
    ...createFileHandle(contents),
    createWritable: vi.fn(() => Promise.resolve(writable)),
  }
  return { handle, writable }
}

async function createDemoPane(fileAccess = false, secureContext = true): Promise<DemoPaneElement> {
  vi.stubGlobal('isSecureContext', secureContext)
  const pane = document.createElement('demo-pane') as DemoPaneElement
  pane.data = initialData
  pane.template = initialTemplate
  pane.editorOpen = true
  pane.fileAccess = fileAccess
  document.body.append(pane)
  await pane.updateComplete
  return pane
}

async function clickAction(pane: DemoPaneElement, label: string): Promise<void> {
  const button = pane.shadowRoot?.querySelector<HTMLElement>(`wa-button[aria-label="${label}"]`)
  if (!button) {
    throw new Error(`Missing ${label} action`)
  }
  button.click()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await pane.updateComplete
}

function editorText(pane: DemoPaneElement, editorId: 'json-editor' | 'template-editor'): string {
  return Array.from(pane.shadowRoot?.querySelectorAll<HTMLElement>(`#${editorId} .cm-line`) ?? [])
    .map((line) => line.textContent ?? '')
    .join('\n')
}

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('demo-pane local file loading', () => {
  it('loads JSON into only the data editor and retains its handle', async () => {
    const contents = '{"patient":{"resourceType":"Observation"}}'
    const handle = createFileHandle(contents)
    const picker = vi.fn(() => Promise.resolve([handle]))
    vi.stubGlobal('showOpenFilePicker', picker)
    const pane = await createDemoPane(true)

    await clickAction(pane, 'Open JSON file')

    expect(picker).toHaveBeenCalledWith({
      multiple: false,
      types: [{ description: 'JSON data', accept: { 'application/json': ['.json'] } }],
    })
    expect(pane.data).toBe(initialData)
    expect(pane._draftData).toBe(contents)
    expect(pane.template).toBe(initialTemplate)
    expect(pane._draftTemplate).toBe(formattedInitialTemplate)
    expect(pane._dataFileHandle).toBe(handle)
    expect(pane._templateFileHandle).toBeNull()
    expect(editorText(pane, 'json-editor')).toBe(contents)
  })

  it('loads markup into only the template editor and retains its handle', async () => {
    const contents = '<strong>${patient.resourceType}</strong>'
    const handle = createFileHandle(contents)
    const picker = vi.fn(() => Promise.resolve([handle]))
    vi.stubGlobal('showOpenFilePicker', picker)
    const pane = await createDemoPane(true)

    await clickAction(pane, 'Open markup file')

    expect(picker).toHaveBeenCalledWith({
      multiple: false,
      types: [{ description: 'Markup templates', accept: { 'text/html': ['.html', '.htm', '.vto'] } }],
    })
    expect(pane.template).toBe(initialTemplate)
    expect(pane._draftTemplate).toBe(contents)
    expect(pane.data).toBe(initialData)
    expect(pane._draftData).toBe(formattedInitialData)
    expect(pane._dataFileHandle).toBeNull()
    expect(pane._templateFileHandle).toBe(handle)
    expect(editorText(pane, 'template-editor')).toBe(contents)
  })

  it('keeps drafts and handles unchanged when the picker is canceled', async () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn().mockRejectedValue(new DOMException('Canceled', 'AbortError')))
    const pane = await createDemoPane(true)

    await clickAction(pane, 'Open JSON file')

    expect(pane.data).toBe(initialData)
    expect(pane._draftData).toBe(formattedInitialData)
    expect(pane._dataFileHandle).toBeNull()
    expect(pane.shadowRoot?.querySelector('.file-access-error')).toBeNull()
  })

  it('shows read failures without replacing the current draft', async () => {
    const handle = {
      ...createFileHandle('ignored'),
      getFile: () => Promise.reject(new Error('Permission denied')),
    }
    vi.stubGlobal('showOpenFilePicker', vi.fn(() => Promise.resolve([handle])))
    const pane = await createDemoPane(true)

    await clickAction(pane, 'Open JSON file')

    expect(pane.data).toBe(initialData)
    expect(pane._draftData).toBe(formattedInitialData)
    expect(pane._dataFileHandle).toBeNull()
    expect(pane.shadowRoot?.querySelector('.file-access-error')?.textContent)
      .toContain('Could not open JSON data: Permission denied')
  })

  it('routes invalid JSON through the visible preview validation error', async () => {
    const handle = createFileHandle('{ invalid JSON')
    vi.stubGlobal('showOpenFilePicker', vi.fn(() => Promise.resolve([handle])))
    const pane = await createDemoPane(true)

    await clickAction(pane, 'Open JSON file')

    expect(pane._draftData).toBe('{ invalid JSON')
    expect(pane.shadowRoot?.querySelector('.pane-content .error')?.textContent)
      .toContain('JSON parse error')
  })

  it('keeps file actions disabled by default when the browser supports file access', async () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn())
    vi.stubGlobal('showSaveFilePicker', vi.fn())
    const pane = await createDemoPane()

    expect(pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Open JSON file"]')
      ?.hasAttribute('disabled')).toBe(true)
    expect(pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Save JSON file"]')
      ?.hasAttribute('disabled')).toBe(true)
    expect(pane.hasAttribute('file-access')).toBe(false)
    expect(pane.shadowRoot?.querySelector('.file-access-status')).toBeNull()
  })

  it('enables file actions when opted in and supported in a secure context', async () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn())
    vi.stubGlobal('showSaveFilePicker', vi.fn())
    const pane = await createDemoPane(true)

    expect(pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Open JSON file"]')
      ?.hasAttribute('disabled')).toBe(false)
    expect(pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Save JSON file"]')
      ?.hasAttribute('disabled')).toBe(false)
    expect(pane.hasAttribute('file-access')).toBe(true)
  })

  it('keeps opted-in file actions disabled and status visually hidden when picker APIs are absent', async () => {
    vi.stubGlobal('showOpenFilePicker', undefined)
    vi.stubGlobal('showSaveFilePicker', undefined)
    const pane = await createDemoPane(true)

    const openButton = pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Open JSON file"]')
    const saveButton = pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Save JSON file"]')
    const status = pane.shadowRoot?.querySelector<HTMLElement>('.file-access-status')

    expect(openButton?.hasAttribute('disabled')).toBe(true)
    expect(saveButton?.hasAttribute('disabled')).toBe(true)
    expect(status?.getAttribute('role')).toBe('status')
    expect(status?.classList.contains('visually-hidden')).toBe(true)
    expect(status?.textContent)
      .toContain('Local file access requires Chromium')
    const cssText = (styles as { cssText: string }).cssText
    expect(cssText).toContain('position: absolute')
    expect(cssText).toContain('clip: rect(0, 0, 0, 0)')
  })

  it('keeps opted-in file actions disabled outside a secure context', async () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn())
    vi.stubGlobal('showSaveFilePicker', vi.fn())
    const pane = await createDemoPane(true, false)

    expect(pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Open JSON file"]')
      ?.hasAttribute('disabled')).toBe(true)
    expect(pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Save JSON file"]')
      ?.hasAttribute('disabled')).toBe(true)
    expect(pane.shadowRoot?.querySelector('.file-access-status')?.classList.contains('visually-hidden'))
      .toBe(true)
  })

  it('saves the latest JSON and markup drafts to their separate handles', async () => {
    const dataFile = createWritableFileHandle('')
    const markupFile = createWritableFileHandle('')
    const pane = await createDemoPane(true)
    pane._dataFileHandle = dataFile.handle
    pane._templateFileHandle = markupFile.handle
    const latestData = '{"patient":{"resourceType":"Observation"}}'
    const latestTemplate = '<article>${patient.resourceType}</article>'
    const jsonEditor = pane._jsonEditor
    const templateEditor = pane._templateEditor
    if (!jsonEditor || !templateEditor) {
      throw new Error('Expected both demo editors to be initialized')
    }
    jsonEditor.dispatch({ changes: { from: 0, to: jsonEditor.state.doc.length, insert: latestData } })
    templateEditor.dispatch({ changes: { from: 0, to: templateEditor.state.doc.length, insert: latestTemplate } })

    await clickAction(pane, 'Save JSON file')
    await clickAction(pane, 'Save markup file')

    expect(dataFile.writable.write).toHaveBeenCalledWith(latestData)
    expect(dataFile.writable.close).toHaveBeenCalledOnce()
    expect(markupFile.writable.write).toHaveBeenCalledWith(latestTemplate)
    expect(markupFile.writable.close).toHaveBeenCalledOnce()
  })

  it('prompts for a save destination when no associated handle exists', async () => {
    const file = createWritableFileHandle('')
    const picker = vi.fn(() => Promise.resolve(file.handle))
    vi.stubGlobal('showSaveFilePicker', picker)
    const pane = await createDemoPane(true)

    await clickAction(pane, 'Save JSON file')

    expect(picker).toHaveBeenCalledWith({
      suggestedName: 'data.json',
      types: [{ description: 'JSON data', accept: { 'application/json': ['.json'] } }],
    })
    expect(file.writable.write).toHaveBeenCalledWith(formattedInitialData)
    expect(pane._dataFileHandle).toBe(file.handle)
  })

  it('keeps drafts and handles unchanged when the save picker is canceled', async () => {
    vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(new DOMException('Canceled', 'AbortError')))
    const pane = await createDemoPane(true)

    await clickAction(pane, 'Save JSON file')

    expect(pane._draftData).toBe(formattedInitialData)
    expect(pane._dataFileHandle).toBeNull()
    expect(pane.shadowRoot?.querySelector('.file-access-error')).toBeNull()
  })

  it.each(['write', 'close'] as const)('shows %s failures when saving', async (failure) => {
    const file = createWritableFileHandle('', failure)
    const pane = await createDemoPane(true)
    pane._dataFileHandle = file.handle

    await clickAction(pane, 'Save JSON file')

    expect(pane.shadowRoot?.querySelector('.file-access-error')?.textContent)
      .toContain(failure === 'write' ? 'Could not save JSON data: Disk full' : 'Could not save JSON data: Close failed')
    expect(file.writable.abort).toHaveBeenCalledOnce()
    expect(pane._dataFileHandle).toBe(file.handle)
  })
})

describe('demo-pane editor actions', () => {
  it('groups JSON, markup, and shared actions with their respective editors', async () => {
    const pane = await createDemoPane(true)
    const shadowRoot = pane.shadowRoot

    const actionLabels = (selector: string) =>
      Array.from(shadowRoot?.querySelectorAll<HTMLElement>(selector) ?? [])
        .map((button) => button.getAttribute('aria-label'))

    expect(actionLabels('.editor-field[slot="start"] .editor-field-actions wa-button')).toEqual([
      'Format JSON',
      'Open JSON file',
      'Save JSON file',
    ])
    expect(actionLabels('.editor-field[slot="end"] .editor-field-actions wa-button')).toEqual([
      'Format HTML',
      'Open markup file',
      'Save markup file',
    ])
    expect(actionLabels('.editor-actions wa-button')).toEqual([
      'Run demo',
      'Toggle output height',
      'Toggle editor height',
      'Reset demo',
    ])
  })

  it('provides a matching tooltip for every icon action', async () => {
    const pane = await createDemoPane()
    const buttons = Array.from(pane.shadowRoot?.querySelectorAll<HTMLElement>('wa-button[aria-label]') ?? [])

    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button.id).not.toBe('')
      const tooltip = pane.shadowRoot?.querySelector(`wa-tooltip[for="${button.id}"]`)
      expect(tooltip?.textContent?.trim()).toBe(button.title)
      expect(button.getAttribute('aria-label')).not.toBe('')
    }
  })

  it('reserves editor space for action clusters and adapts them to compact panes', () => {
    const cssText = (styles as { cssText: string }).cssText

    expect(cssText).toContain('.editor-field-actions')
    expect(cssText).toContain('grid-row: 2')
    expect(cssText).toContain('padding-block-start: 2.5rem')
    expect(cssText).toContain('max-inline-size: calc(100% - 0.75rem)')
    expect(cssText).toContain('overflow-x: auto')
    expect(cssText).toContain('@media (max-width: 768px)')
    expect(cssText).toContain('padding-block-start: 2.25rem')
  })
})
