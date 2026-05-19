import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const TEST_PORT = 3311
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`
const TEST_DIR = new URL('../', import.meta.url)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      const text = response.ok ? await response.text() : ''
      if (response.ok && text.includes('<demo-pane')) {
        return
      }
    } catch {
      // retry
    }
    await delay(300)
  }
  throw new Error(`Timed out waiting for server at ${url}`)
}

function startServer() {
  const child = spawn('deno', [
    'task',
    'lume',
    '-s',
    '--port',
    String(TEST_PORT),
  ], {
    cwd: TEST_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[serve] ${chunk}`)
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[serve] ${chunk}`)
  })

  return child
}

function getOutputText(host) {
  return host.evaluate((el) => {
    const output = el.shadowRoot?.querySelector('.output-container')
    return output?.textContent?.trim() ?? ''
  })
}

function getErrorText(host) {
  return host.evaluate((el) => {
    const error = el.shadowRoot?.querySelector('.error')
    return error?.textContent?.trim() ?? ''
  })
}

function getPreviewHeight(host) {
  return host.evaluate((el) => {
    const preview = el.shadowRoot?.querySelector('.editable-preview')
    return preview instanceof HTMLElement ? preview.getBoundingClientRect().height : 0
  })
}

function getEditorSizing(host) {
  return host.evaluate((el) => {
    const panel = el.shadowRoot?.querySelector('.editor-panel-content')
    const split = el.shadowRoot?.querySelector('.editor-split')
    if (!(panel instanceof HTMLElement) || !(split instanceof HTMLElement)) {
      return null
    }
    const readPx = (value) => {
      const parsed = Number.parseFloat(value ?? '')
      return Number.isFinite(parsed) ? parsed : 0
    }
    const measureField = (field, editor) => {
      const host = field?.querySelector('.editor-host, code-example')
      if (!(field instanceof HTMLElement) || !(host instanceof HTMLElement)) {
        return 0
      }
      const contentDOM = editor?.contentDOM ??
        ('contentDOM' in host && host.contentDOM instanceof HTMLElement ? host.contentDOM : null)
      const contentHeight = contentDOM instanceof HTMLElement
        ? Math.max(contentDOM.getBoundingClientRect().height, contentDOM.scrollHeight)
        : host.scrollHeight
      const extraRows = [...field.children].filter((child) =>
        child instanceof HTMLElement && child !== host && child.getBoundingClientRect().height > 0
      )
      const extraRowsHeight = extraRows.reduce(
        (total, child) => total + Math.ceil(child.getBoundingClientRect().height),
        0,
      )
      const fieldStyles = globalThis.getComputedStyle(field)
      const fieldGap = extraRows.length > 0 ? readPx(fieldStyles.rowGap || fieldStyles.gap) : 0
      const hostStyles = globalThis.getComputedStyle(host)
      const hostBorder = readPx(hostStyles.borderTopWidth) + readPx(hostStyles.borderBottomWidth)
      return contentHeight + extraRowsHeight + fieldGap + hostBorder
    }
    const jsonHeight = measureField(
      el.shadowRoot?.querySelector('.editor-field[slot="start"]'),
      el._jsonEditor,
    )
    const templateHeight = measureField(
      el.shadowRoot?.querySelector('.editor-field[slot="end"]'),
      el._templateEditor,
    )
    return {
      panelHeight: panel.getBoundingClientRect().height,
      splitHeight: split.getBoundingClientRect().height,
      jsonHeight,
      templateHeight,
    }
  })
}

async function setJson(host, value) {
  const jsonEditor = host.locator('#json-editor .cm-content')
  await jsonEditor.click()
  await jsonEditor.page().keyboard.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A',
  )
  await jsonEditor.page().keyboard.type(value)
}

async function setTemplate(host, value) {
  const templateEditor = host.locator('#template-editor .cm-content')
  await templateEditor.click()
  await templateEditor.page().keyboard.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A',
  )
  await templateEditor.page().keyboard.type(value)
}

function getTemplateDoc(host) {
  return host.evaluate((el) => el._templateEditor?.state.doc.toString() ?? '')
}

async function clickEditorAction(host, label) {
  await host.locator(`wa-button[aria-label="${label}"]`).click()
}

async function run() {
  const server = startServer()
  let browser
  try {
    await waitForServer(`${BASE_URL}/`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`${BASE_URL}/?t=${Date.now()}`, {
      waitUntil: 'networkidle',
    })

    const host = page.locator('demo-pane').first()
    await host.waitFor()

    const initial = await getOutputText(host)
    assert(
      initial.includes('Release v0.2.0'),
      `Unexpected initial output: ${initial}`,
    )

    await delay(250)
    const initialEditorSizing = await getEditorSizing(host)
    const initialLongestEditor = Math.max(
      initialEditorSizing?.jsonHeight ?? 0,
      initialEditorSizing?.templateHeight ?? 0,
    )
    assert(
      initialEditorSizing &&
        initialEditorSizing.splitHeight >= initialLongestEditor - 2,
      `Editor did not auto-size to content: ${JSON.stringify(initialEditorSizing)}`,
    )

    const outputBackground = await host.evaluate((el) => {
      const output = el.shadowRoot?.querySelector('.output-container')
      if (!(output instanceof HTMLElement)) {
        return null
      }
      const style = globalThis.getComputedStyle(output)
      return {
        color: style.backgroundColor,
        image: style.backgroundImage,
      }
    })
    assert(
      outputBackground?.color && outputBackground.color !== 'rgba(0, 0, 0, 0)',
      'Output background was not applied',
    )
    assert(
      outputBackground?.image === 'none',
      `Expected solid background, got: ${outputBackground?.image}`,
    )

    const previewHeightBefore = await getPreviewHeight(host)
    await host.evaluate((el) => {
      const handle = el.shadowRoot?.querySelector('.preview-resizer')
      if (!(handle instanceof HTMLElement)) {
        throw new Error('Missing preview resizer')
      }
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 200 }),
      )
      globalThis.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 320 }),
      )
      globalThis.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 320 }),
      )
    })
    await delay(80)
    const previewHeightAfter = await getPreviewHeight(host)
    assert(
      previewHeightAfter > previewHeightBefore + 40,
      `Preview did not resize as expected: before=${previewHeightBefore}, after=${previewHeightAfter}`,
    )

    await host.evaluate((el) => {
      const handle = el.shadowRoot?.querySelector('.editor-resizer')
      if (!(handle instanceof HTMLElement)) {
        throw new Error('Missing editor resizer')
      }
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 200 }),
      )
      globalThis.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 280 }),
      )
      globalThis.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 280 }),
      )
    })
    await delay(80)
    const manualEditorSizing = await getEditorSizing(host)
    assert(
      manualEditorSizing &&
        manualEditorSizing.panelHeight > initialEditorSizing.panelHeight + 40,
      `Editor did not resize manually: before=${JSON.stringify(initialEditorSizing)}, after=${
        JSON.stringify(manualEditorSizing)
      }`,
    )

    await setTemplate(
      host,
      `<section>
  <h2>\${label}</h2>
  <p>One</p>
  <p>Two</p>
  <p>Three</p>
  <p>Four</p>
  <p>Five</p>
  <p>Six</p>
  <p>Seven</p>
  <p>Eight</p>
  <p>Nine</p>
  <p>Ten</p>
</section>`,
    )
    await delay(250)
    const afterManualEditSizing = await getEditorSizing(host)
    assert(
      afterManualEditSizing &&
        Math.abs(
            afterManualEditSizing.panelHeight - manualEditorSizing.panelHeight,
          ) < 2,
      `Editor auto-sizing overrode manual resize: manual=${JSON.stringify(manualEditorSizing)}, afterEdit=${
        JSON.stringify(afterManualEditSizing)
      }`,
    )

    await setJson(
      host,
      `{
  "label": "Updated Label",
  "variant": "brand",
  "size": "medium"
}`,
    )
    await clickEditorAction(host, 'Run demo')
    await delay(300)
    const updated = await getOutputText(host)
    assert(
      updated.includes('Updated Label'),
      `Run did not update output: ${updated}`,
    )

    await setJson(host, `{"label":"Broken"`)
    await clickEditorAction(host, 'Run demo')
    await delay(200)
    const error = await getErrorText(host)
    assert(
      error.includes('JSON parse error'),
      `Expected invalid JSON error, got: ${error}`,
    )

    await setTemplate(
      host,
      `<div><wa-button variant="${'${variant}'}">${'${label}'}</wa-button></div>`,
    )
    await clickEditorAction(host, 'Format HTML')
    await delay(200)
    const formattedTemplate = await getTemplateDoc(host)
    assert(
      formattedTemplate.includes('\n  <wa-button') &&
        formattedTemplate.includes('\n</div>'),
      `Format HTML did not expand template as expected:\n${formattedTemplate}`,
    )

    await setJson(
      host,
      `{
  "label": "Docs",
  "variant": "brand",
  "meta": { "subtitle": "Live Preview" },
  "items": ["Alpha", "Beta"]
}`,
    )
    await setTemplate(
      host,
      `<wa-button variant="\${variant}">\${meta?.subtitle ?? label}</wa-button>`,
    )
    await clickEditorAction(host, 'Run demo')
    await delay(250)
    const subtitleOutput = await getOutputText(host)
    assert(
      subtitleOutput.includes('Live Preview'),
      `Nested/optional expression failed: ${subtitleOutput}`,
    )

    await setTemplate(
      host,
      `<ul>\${items.map((item) => '<li>' + item + '</li>').join('')}</ul>`,
    )
    await clickEditorAction(host, 'Run demo')
    await delay(250)
    const listOutput = await getOutputText(host)
    assert(
      listOutput.includes('Alpha') && listOutput.includes('Beta'),
      `Array expression failed: ${listOutput}`,
    )

    await setTemplate(
      host,
      `<ul>\${items.map((item) => \`<li>\${item}</li>\`).join('')}</ul>`,
    )
    await clickEditorAction(host, 'Run demo')
    await delay(250)
    const nestedTemplateOutput = await getOutputText(host)
    assert(
      nestedTemplateOutput.includes('Alpha') &&
        nestedTemplateOutput.includes('Beta'),
      `Nested template-literal expression failed: ${nestedTemplateOutput}`,
    )

    await setJson(
      host,
      `{
  "label": "Lit binding button",
  "disabled": true,
  "title": "Bound via .title"
}`,
    )
    await setTemplate(
      host,
      `<wa-button ?disabled=\${disabled} .title=\${title} @click=\${(event) => event.currentTarget.setAttribute('data-clicked', 'yes')}>\${label}</wa-button>`,
    )
    await clickEditorAction(host, 'Run demo')
    await delay(250)
    const litBindingState = await host.evaluate((el) => {
      const button = el.shadowRoot?.querySelector(
        '.output-container wa-button',
      )
      if (!(button instanceof HTMLElement)) {
        return null
      }
      return {
        disabled: button.disabled === true,
        title: button.title,
      }
    })
    assert(
      litBindingState?.disabled,
      `Boolean Lit binding did not apply: ${JSON.stringify(litBindingState)}`,
    )
    assert(
      litBindingState?.title === 'Bound via .title',
      `Property Lit binding did not apply: ${JSON.stringify(litBindingState)}`,
    )
    await setJson(
      host,
      `{
  "label": "Lit binding button",
  "disabled": false,
  "title": "Bound via .title"
}`,
    )
    await clickEditorAction(host, 'Run demo')
    await delay(250)
    await host.evaluate((el) => {
      const button = el.shadowRoot?.querySelector(
        '.output-container wa-button',
      )
      if (button instanceof HTMLElement) {
        button.click()
      }
    })
    const clickedState = await host.evaluate((el) => {
      const button = el.shadowRoot?.querySelector(
        '.output-container wa-button',
      )
      return button instanceof HTMLElement ? button.getAttribute('data-clicked') : null
    })
    assert(
      clickedState === 'yes',
      `Event Lit binding did not apply: ${clickedState}`,
    )

    const customElementDemo = page.locator('demo-pane').nth(2)
    await customElementDemo.waitFor()
    const customOutputHtml = await customElementDemo.evaluate((el) => {
      const output = el.shadowRoot?.querySelector('.output-container')
      return output?.innerHTML ?? ''
    })
    assert(
      customOutputHtml.includes('<demo-status-pill') &&
        customOutputHtml.includes('Custom element renders'),
      `Custom element was stripped by sanitizer: ${customOutputHtml}`,
    )

    await page.close()
    console.log('demo-pane smoke tests passed')
  } finally {
    if (browser) {
      await browser.close()
    }
    server.kill('SIGTERM')
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
