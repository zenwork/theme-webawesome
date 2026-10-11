import { afterEach, describe, expect, it } from 'vitest'
import './code-example.ts'

type CodeExampleElement = HTMLElement & {
  code: string
  displayCode: string
  language: string
  lineNumbers: boolean
  noLineNumbers: boolean
  padded: boolean
  updateComplete: Promise<boolean>
  contentDOM: HTMLElement | null
  renderRoot: HTMLElement | ShadowRoot
}

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0))

async function renderCodeExample(markup: string): Promise<CodeExampleElement> {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = markup
  const example = wrapper.firstElementChild as CodeExampleElement | null
  if (!example) {
    throw new Error('Expected code-example markup to render an element.')
  }
  document.body.append(example)
  await example.updateComplete
  await nextTask()
  return example
}

async function appendCodeExample(example: CodeExampleElement): Promise<CodeExampleElement> {
  document.body.append(example)
  await example.updateComplete
  await nextTask()
  return example
}

function editorText(example: CodeExampleElement): string {
  return Array.from(example.contentDOM?.querySelectorAll('.cm-line') ?? [])
    .map((line) => line.textContent ?? '')
    .join('\n')
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('code-example', () => {
  it('trims and dedents slotted multiline code', async () => {
    const example = await renderCodeExample(`<code-example>
      const value = 1
        console.log(value)
    </code-example>`)

    expect(example.code).toBe('const value = 1\n  console.log(value)')
    expect(editorText(example)).toBe(example.code)
  })

  it('preserves slotted HTML as source', async () => {
    const example = await renderCodeExample(`<code-example>
      <wa-callout variant="brand">
        <strong>Heads up</strong>
      </wa-callout>
    </code-example>`)

    expect(example.code).toContain('<wa-callout variant="brand">')
    expect(example.code).toContain('<strong>Heads up</strong>')
    expect(editorText(example)).toBe(example.code)
  })

  it('preserves JSX interpolation attributes without adding quotes', async () => {
    const example = await renderCodeExample(`<code-example language="tsx">
      <fhir-patient data={patient} summaryonly={true}></fhir-patient>
    </code-example>`)

    expect(example.code).toBe('<fhir-patient data={patient} summaryonly={true}></fhir-patient>')
    expect(editorText(example)).toBe(example.code)
  })

  it('preserves Lit interpolation attributes without adding quotes', async () => {
    const example = await renderCodeExample(`<code-example language="typescript">
      <fhir-patient .data=\${patient} summaryonly=\${true}></fhir-patient>
    </code-example>`)

    expect(example.code).toBe('<fhir-patient .data=${patient} summaryonly=${true}></fhir-patient>')
    expect(editorText(example)).toBe(example.code)
  })

  it('infers html from slotted element content', async () => {
    const example = await renderCodeExample(`<code-example>
      <wa-callout variant="brand">Heads up</wa-callout>
    </code-example>`)

    expect(example.language).toBe('html')
  })

  it('infers language from slotted data-language attributes', async () => {
    const example = await renderCodeExample(`<code-example>
      <pre data-language="json">{"ready":true}</pre>
    </code-example>`)

    expect(example.language).toBe('json')
  })

  it('infers language from slotted language-* classes', async () => {
    const example = await renderCodeExample(`<code-example>
      <pre><code class="language-ts">const ready = true</code></pre>
    </code-example>`)

    expect(example.language).toBe('typescript')
  })

  it('uses explicit code instead of slotted content', async () => {
    const example = document.createElement('code-example') as CodeExampleElement
    example.code = 'const source = "property"'
    example.textContent = 'const source = "slot"'

    await appendCodeExample(example)

    expect(example.code).toBe('const source = "property"')
    expect(editorText(example)).toBe('const source = "property"')
  })

  it('updates code when slot-backed content changes', async () => {
    const example = await renderCodeExample(`<code-example>const source = "slot"</code-example>`)

    example.textContent = 'const source = "updated slot"'
    await example.updateComplete
    await nextTask()

    expect(example.code).toBe('const source = "updated slot"')
    expect(editorText(example)).toBe('const source = "updated slot"')
  })

  it('shows line numbers by default', async () => {
    const example = await renderCodeExample(`<code-example>const ready = true</code-example>`)

    expect(example.renderRoot.querySelector('.cm-gutters')).not.toBeNull()
  })

  it('hides line numbers with a static no-line-numbers attribute', async () => {
    const example = await renderCodeExample(`<code-example no-line-numbers>const ready = true</code-example>`)

    expect(example.renderRoot.querySelector('.cm-gutters')).toBeNull()
  })

  it('keeps lineNumbers as a JavaScript compatibility alias', async () => {
    const example = document.createElement('code-example') as CodeExampleElement
    example.lineNumbers = false
    example.textContent = 'const ready = true'

    await appendCodeExample(example)

    expect(example.noLineNumbers).toBe(true)
    expect(example.renderRoot.querySelector('.cm-gutters')).toBeNull()
  })

  it('adds one blank line before and after slotted code when padded', async () => {
    const example = await renderCodeExample(`<code-example padded>
      const ready = true
    </code-example>`)

    expect(example.code).toBe('const ready = true')
    expect(example.displayCode).toBe('\nconst ready = true\n')
    expect(editorText(example)).toBe('\nconst ready = true\n')
  })

  it('adds one blank line before and after explicit code when padded', async () => {
    const example = document.createElement('code-example') as CodeExampleElement
    example.code = 'const ready = true'
    example.padded = true

    await appendCodeExample(example)

    expect(example.code).toBe('const ready = true')
    expect(example.displayCode).toBe('\nconst ready = true\n')
    expect(editorText(example)).toBe('\nconst ready = true\n')
  })

  it('does not duplicate existing blank edges when padded', async () => {
    const example = document.createElement('code-example') as CodeExampleElement
    example.code = '\n\n  const ready = true\n\n'
    example.padded = true

    await appendCodeExample(example)

    expect(example.code).toBe('\n\n  const ready = true\n\n')
    expect(example.displayCode).toBe('\nconst ready = true\n')
    expect(editorText(example)).toBe('\nconst ready = true\n')
  })

  it('supports css as an explicit language', async () => {
    const example = await renderCodeExample(`<code-example language="css">
      .example {
        color: rebeccapurple;
      }
    </code-example>`)

    expect(example.language).toBe('css')
  })

  it('infers jsx from language-* classes', async () => {
    const example = await renderCodeExample(`<code-example>
      <pre><code class="language-jsx">const view = &lt;Alert /&gt;</code></pre>
    </code-example>`)

    expect(example.language).toBe('jsx')
  })

  it('infers tsx from language attributes', async () => {
    const example = await renderCodeExample(`<code-example>
      <pre language="tsx">const view = &lt;Alert message="Ready" /&gt;</pre>
    </code-example>`)

    expect(example.language).toBe('tsx')
  })
})
