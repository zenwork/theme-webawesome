import { afterEach, describe, expect, it, vi } from 'vitest'
import './demo-pane.ts'
import { formatHtmlTemplate } from './template-renderer.ts'

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

async function createDemoPane(): Promise<DemoPaneElement> {
  const pane = document.createElement('demo-pane') as DemoPaneElement
  pane.data = initialData
  pane.template = initialTemplate
  pane.editorOpen = true
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
    const pane = await createDemoPane()

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
    const pane = await createDemoPane()

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
    const pane = await createDemoPane()

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
    const pane = await createDemoPane()

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
    const pane = await createDemoPane()

    await clickAction(pane, 'Open JSON file')

    expect(pane._draftData).toBe('{ invalid JSON')
    expect(pane.shadowRoot?.querySelector('.pane-content .error')?.textContent)
      .toContain('JSON parse error')
  })

  it('shows an unsupported state when the open picker API is absent', async () => {
    vi.stubGlobal('showOpenFilePicker', undefined)
    vi.stubGlobal('showSaveFilePicker', undefined)
    const pane = await createDemoPane()

    const openButton = pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Open JSON file"]')
    const saveButton = pane.shadowRoot?.querySelector<HTMLElement>('wa-button[aria-label="Save JSON file"]')

    expect(openButton?.hasAttribute('disabled')).toBe(true)
    expect(saveButton?.hasAttribute('disabled')).toBe(true)
    expect(pane.shadowRoot?.querySelector('[role="status"]')?.textContent)
      .toContain('Local file access requires Chromium')
  })

  it('saves the latest JSON and markup drafts to their separate handles', async () => {
    const dataFile = createWritableFileHandle('')
    const markupFile = createWritableFileHandle('')
    const pane = await createDemoPane()
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
    const pane = await createDemoPane()

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
    const pane = await createDemoPane()

    await clickAction(pane, 'Save JSON file')

    expect(pane._draftData).toBe(formattedInitialData)
    expect(pane._dataFileHandle).toBeNull()
    expect(pane.shadowRoot?.querySelector('.file-access-error')).toBeNull()
  })

  it.each(['write', 'close'] as const)('shows %s failures when saving', async (failure) => {
    const file = createWritableFileHandle('', failure)
    const pane = await createDemoPane()
    pane._dataFileHandle = file.handle

    await clickAction(pane, 'Save JSON file')

    expect(pane.shadowRoot?.querySelector('.file-access-error')?.textContent)
      .toContain(failure === 'write' ? 'Could not save JSON data: Disk full' : 'Could not save JSON data: Close failed')
    expect(file.writable.abort).toHaveBeenCalledOnce()
    expect(pane._dataFileHandle).toBe(file.handle)
  })
})
