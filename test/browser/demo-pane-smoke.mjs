import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'npm:playwright@1.60.0'

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

function getOutputContainerHeight(host) {
  return host.evaluate((el) => {
    const output = el.shadowRoot?.querySelector('.output-container')
    return output instanceof HTMLElement ? output.getBoundingClientRect().height : 0
  })
}

function getOutputContainerOverflowState(host) {
  return host.evaluate((el) => {
    const output = el.shadowRoot?.querySelector('.output-container')
    if (!(output instanceof HTMLElement)) {
      const error = el.shadowRoot?.querySelector('.error')
      return {
        clientHeight: 0,
        scrollHeight: 0,
        hasVerticalOverflow: false,
        errorText: error?.textContent?.trim() ?? '',
      }
    }
    const filler = globalThis.document.createElement('div')
    filler.style.inlineSize = '2400px'
    filler.style.blockSize = '2400px'
    filler.style.whiteSpace = 'nowrap'
    filler.textContent = 'overflow probe'
    output.append(filler)
    const style = globalThis.getComputedStyle(output)
    const state = {
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      hasHorizontalOverflow: output.scrollWidth > output.clientWidth,
      hasVerticalOverflow: output.scrollHeight > output.clientHeight,
    }
    filler.remove()
    return state
  })
}

function getOutputContainerScrollMetrics(host) {
  return host.evaluate((el) => {
    const output = el.shadowRoot?.querySelector('.output-container')
    if (!(output instanceof HTMLElement)) {
      return null
    }
    return {
      clientHeight: output.clientHeight,
      scrollHeight: output.scrollHeight,
      hasVerticalOverflow: output.scrollHeight > output.clientHeight,
    }
  })
}

function getPreviewResizerBottomGap(host) {
  return host.evaluate((el) => {
    const preview = el.shadowRoot?.querySelector('.editable-preview')
    const resizer = el.shadowRoot?.querySelector('.preview-resizer')
    if (
      !(preview instanceof HTMLElement) || !(resizer instanceof HTMLElement)
    ) {
      return null
    }
    const previewRect = preview.getBoundingClientRect()
    const resizerRect = resizer.getBoundingClientRect()
    return previewRect.bottom - resizerRect.bottom
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
        ? Math.max(
          contentDOM.getBoundingClientRect().height,
          contentDOM.scrollHeight,
        )
        : host.scrollHeight
      const extraRows = [...field.children].filter((child) =>
        child instanceof HTMLElement && child !== host &&
        child.getBoundingClientRect().height > 0
      )
      const extraRowsHeight = extraRows.reduce(
        (total, child) => total + Math.ceil(child.getBoundingClientRect().height),
        0,
      )
      const fieldStyles = globalThis.getComputedStyle(field)
      const fieldGap = extraRows.length > 0 ? readPx(fieldStyles.rowGap || fieldStyles.gap) : 0
      const hostStyles = globalThis.getComputedStyle(host)
      const hostBorder = readPx(hostStyles.borderTopWidth) +
        readPx(hostStyles.borderBottomWidth)
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

function getEditorWidthMetrics(host) {
  return host.evaluate((el) => {
    const measure = (selector) => {
      const field = el.shadowRoot?.querySelector(selector)
      const content = field?.querySelector('.cm-content')
      const editor = field?.querySelector('.cm-editor')
      const scroller = field?.querySelector('.cm-scroller')
      if (!(field instanceof HTMLElement)) {
        return null
      }
      const slotRect = field.getBoundingClientRect()
      const contentRect = content instanceof HTMLElement ? content.getBoundingClientRect() : null
      const editorRect = editor instanceof HTMLElement ? editor.getBoundingClientRect() : null
      const scrollerRect = scroller instanceof HTMLElement ? scroller.getBoundingClientRect() : null
      return {
        slotWidth: slotRect.width,
        contentWidth: contentRect?.width ?? 0,
        editorWidth: editorRect?.width ?? 0,
        scrollerWidth: scrollerRect?.width ?? 0,
      }
    }
    return {
      start: measure('.editor-field[slot="start"]'),
      end: measure('.editor-field[slot="end"]'),
    }
  })
}

function getEditorBackgroundMetrics(host) {
  return host.evaluate((el) => {
    const backgroundOf = (selector) => {
      const node = el.shadowRoot?.querySelector(selector)
      return node instanceof HTMLElement ? globalThis.getComputedStyle(node).backgroundColor : null
    }
    const codeExample = el.shadowRoot?.querySelector(
      '.editor-field code-example',
    )
    const codeExampleEditor = codeExample?.shadowRoot?.querySelector(
      '.cm-editor',
    )
    return {
      panel: backgroundOf('.editor-panel-content'),
      split: backgroundOf('.editor-split'),
      field: backgroundOf('.editor-field[slot="start"]'),
      editableHost: backgroundOf('#json-editor'),
      editableCodeMirror: backgroundOf('#json-editor .cm-editor'),
      readOnlyHost: codeExample instanceof HTMLElement
        ? globalThis.getComputedStyle(codeExample).backgroundColor
        : null,
      readOnlyCodeMirror: codeExampleEditor instanceof HTMLElement
        ? globalThis.getComputedStyle(codeExampleEditor).backgroundColor
        : null,
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

function setTemplateDirect(host, value) {
  return host.evaluate((el, nextTemplate) => {
    el._draftTemplate = nextTemplate
    el._templateEditor?.dispatch({
      changes: {
        from: 0,
        to: el._templateEditor.state.doc.length,
        insert: nextTemplate,
      },
    })
    el.processData()
  }, value)
}

function setJsonDirect(host, value) {
  return host.evaluate((el, nextJson) => {
    el._draftData = nextJson
    el._jsonEditor?.dispatch({
      changes: {
        from: 0,
        to: el._jsonEditor.state.doc.length,
        insert: nextJson,
      },
    })
    el.processData()
  }, value)
}

function getTemplateDoc(host) {
  return host.evaluate((el) => el._templateEditor?.state.doc.toString() ?? '')
}

async function clickEditorAction(host, label) {
  await host.locator(`wa-button[aria-label="${label}"]`).click()
}

async function pressRunShortcut(host) {
  const templateEditor = host.locator('#template-editor .cm-content')
  await templateEditor.click()
  await templateEditor.page().keyboard.press(
    process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter',
  )
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
    assert(
      initialEditorSizing &&
        initialEditorSizing.panelHeight >= 200 &&
        initialEditorSizing.splitHeight >= 120,
      `Editor did not keep the expected minimum height: ${JSON.stringify(initialEditorSizing)}`,
    )
    const initialTemplateDoc = await getTemplateDoc(host)
    assert(
      initialTemplateDoc.includes('\n'),
      `Template was not formatted on initial render: ${initialTemplateDoc.slice(0, 240)}`,
    )
    const editableBackgrounds = await getEditorBackgroundMetrics(host)
    assert(
      editableBackgrounds.editableCodeMirror &&
        editableBackgrounds.panel === editableBackgrounds.editableCodeMirror &&
        editableBackgrounds.split === editableBackgrounds.editableCodeMirror &&
        editableBackgrounds.field === editableBackgrounds.editableCodeMirror &&
        editableBackgrounds.editableHost ===
          editableBackgrounds.editableCodeMirror,
      `Editable CodeMirror pane backgrounds did not match: ${JSON.stringify(editableBackgrounds)}`,
    )

    const readOnlyHost = page.locator('demo-pane').nth(1)
    await readOnlyHost.waitFor()
    await delay(120)
    const readOnlyBackgrounds = await getEditorBackgroundMetrics(readOnlyHost)
    assert(
      readOnlyBackgrounds.readOnlyCodeMirror &&
        readOnlyBackgrounds.panel === readOnlyBackgrounds.readOnlyCodeMirror &&
        readOnlyBackgrounds.split === readOnlyBackgrounds.readOnlyCodeMirror &&
        readOnlyBackgrounds.field === readOnlyBackgrounds.readOnlyCodeMirror &&
        readOnlyBackgrounds.readOnlyHost ===
          readOnlyBackgrounds.readOnlyCodeMirror,
      `Read-only CodeMirror pane backgrounds did not match: ${JSON.stringify(readOnlyBackgrounds)}`,
    )

    await setTemplate(host, `<section>${'X'.repeat(1200)}</section>`)
    await delay(120)
    const widthMetrics = await getEditorWidthMetrics(host)
    assert(
      widthMetrics?.end &&
        widthMetrics.end.contentWidth <= widthMetrics.end.slotWidth + 2 &&
        widthMetrics.end.editorWidth <= widthMetrics.end.slotWidth + 2 &&
        widthMetrics.end.scrollerWidth <= widthMetrics.end.slotWidth + 2,
      `Template editor width overflowed its split-pane slot: ${JSON.stringify(widthMetrics?.end)}`,
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

    const longRows = Array.from(
      { length: 80 },
      (_, index) => `Row ${String(index + 1).padStart(2, '0')}`,
    )
    await setTemplateDirect(
      host,
      `<section><h3>Fit output height check</h3><div>${
        longRows.map((row) => `<p>${row}</p>`).join('')
      }</div></section>`,
    )
    await delay(250)
    const fitTogglePressed = await host.locator(
      'wa-button[aria-label="Toggle output height"]',
    ).getAttribute(
      'aria-pressed',
    )
    if (fitTogglePressed === 'true') {
      await clickEditorAction(host, 'Toggle output height')
      await delay(120)
    }
    const fitBeforePreviewHeight = await getPreviewHeight(host)
    const fitBeforeScrollMetrics = await getOutputContainerScrollMetrics(host)
    assert(
      fitBeforeScrollMetrics?.hasVerticalOverflow,
      `Expected overflow before fitting output height: ${JSON.stringify(fitBeforeScrollMetrics)}`,
    )
    await clickEditorAction(host, 'Toggle output height')
    await delay(120)
    const fitAfterPreviewHeight = await getPreviewHeight(host)
    const fitAfterScrollMetrics = await getOutputContainerScrollMetrics(host)
    assert(
      fitAfterPreviewHeight > fitBeforePreviewHeight,
      `Fit output action did not increase preview height: before=${fitBeforePreviewHeight}, after=${fitAfterPreviewHeight}`,
    )
    assert(
      fitAfterScrollMetrics &&
        fitAfterScrollMetrics.scrollHeight <=
          fitAfterScrollMetrics.clientHeight + 2 &&
        !fitAfterScrollMetrics.hasVerticalOverflow,
      `Output still overflowed after fit action: ${JSON.stringify(fitAfterScrollMetrics)}`,
    )
    await clickEditorAction(host, 'Toggle output height')
    await delay(120)
    const fitRestoredPreviewHeight = await getPreviewHeight(host)
    assert(
      fitRestoredPreviewHeight < fitAfterPreviewHeight - 10,
      `Output height toggle did not shrink after second click: expanded=${fitAfterPreviewHeight}, restored=${fitRestoredPreviewHeight}`,
    )

    const previewHeightBefore = await getPreviewHeight(host)
    const outputHeightBefore = await getOutputContainerHeight(host)
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
    const outputHeightAfter = await getOutputContainerHeight(host)
    assert(
      outputHeightAfter > outputHeightBefore + 40,
      `Output container did not resize with preview: before=${outputHeightBefore}, after=${outputHeightAfter}`,
    )
    const outputOverflowState = await getOutputContainerOverflowState(host)
    assert(
      outputOverflowState?.overflowY === 'auto' ||
        outputOverflowState?.overflowY === 'scroll',
      `Output container overflowY should be scrollable, got: ${outputOverflowState?.overflowY}`,
    )
    assert(
      outputOverflowState?.overflowX === 'auto' ||
        outputOverflowState?.overflowX === 'scroll',
      `Output container overflowX should be scrollable, got: ${outputOverflowState?.overflowX}`,
    )
    assert(
      outputOverflowState?.hasVerticalOverflow,
      `Output container did not report overflow when content exceeded available height: ${
        JSON.stringify(outputOverflowState)
      }`,
    )
    assert(
      outputOverflowState?.hasHorizontalOverflow,
      `Output container did not report overflow when content exceeded available width: ${
        JSON.stringify(outputOverflowState)
      }`,
    )
    await host.evaluate((el) => {
      const handle = el.shadowRoot?.querySelector('.preview-resizer')
      if (!(handle instanceof HTMLElement)) {
        throw new Error('Missing preview resizer')
      }
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientY: 200 }),
      )
      globalThis.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, clientY: 1500 }),
      )
      globalThis.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, clientY: 1500 }),
      )
    })
    await delay(80)
    const previewHeightAfterLargeDrag = await getPreviewHeight(host)
    assert(
      previewHeightAfterLargeDrag > 960,
      `Preview height remained capped: ${previewHeightAfterLargeDrag}`,
    )
    const previewResizerBottomGap = await getPreviewResizerBottomGap(host)
    assert(
      typeof previewResizerBottomGap === 'number' &&
        Math.abs(previewResizerBottomGap) <= 2,
      `Preview resizer is not anchored to the preview bottom edge: gap=${previewResizerBottomGap}`,
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

    await setTemplateDirect(
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

    await setTemplateDirect(
      host,
      `<section>
${Array.from({ length: 80 }, (_, index) => `  <p>Editor fit row ${index + 1}</p>`).join('\n')}
</section>`,
    )
    await delay(250)
    const editorToggleBefore = await getEditorSizing(host)
    await clickEditorAction(host, 'Toggle editor height')
    await delay(200)
    const editorToggleExpanded = await getEditorSizing(host)
    assert(
      editorToggleBefore && editorToggleExpanded &&
        editorToggleExpanded.panelHeight > editorToggleBefore.panelHeight + 40,
      `Editor height toggle did not expand: before=${JSON.stringify(editorToggleBefore)}, after=${
        JSON.stringify(editorToggleExpanded)
      }`,
    )
    const largestExpandedEditor = Math.max(
      editorToggleExpanded?.jsonHeight ?? 0,
      editorToggleExpanded?.templateHeight ?? 0,
    )
    assert(
      editorToggleExpanded &&
        editorToggleExpanded.splitHeight >= largestExpandedEditor - 2,
      `Editor fit did not reach the largest CodeMirror content height: ${JSON.stringify(editorToggleExpanded)}`,
    )
    await clickEditorAction(host, 'Toggle editor height')
    await delay(200)
    const editorToggleRestored = await getEditorSizing(host)
    assert(
      editorToggleRestored &&
        Math.abs(
            editorToggleRestored.panelHeight - editorToggleBefore.panelHeight,
          ) < 8,
      `Editor height toggle did not restore: before=${JSON.stringify(editorToggleBefore)}, restored=${
        JSON.stringify(editorToggleRestored)
      }`,
    )

    await setTemplateDirect(
      host,
      `<div><wa-button variant="${'${variant}'}">${'${label}'}</wa-button></div>`,
    )
    await delay(120)
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

    await setJson(
      host,
      `{
  "label": "Shortcut Label",
  "variant": "brand",
  "size": "medium"
}`,
    )
    await pressRunShortcut(host)
    await delay(300)
    const shortcutUpdated = await getOutputText(host)
    assert(
      shortcutUpdated.includes('Shortcut Label'),
      `Shortcut run did not update output: ${shortcutUpdated}`,
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

    await setJsonDirect(
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

    await setTemplateDirect(host, `\${items[0]} / \${items[1]}`)
    await clickEditorAction(host, 'Run demo')
    await delay(250)
    const listOutput = await getOutputText(host)
    assert(
      listOutput.includes('Alpha') && listOutput.includes('Beta'),
      `Array expression failed: ${listOutput}`,
    )

    await setTemplateDirect(host, `\${\`\${items[0]} / \${items[1]}\`}`)
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

    await page.goto(`${BASE_URL}/demo/?t=${Date.now()}`, {
      waitUntil: 'networkidle',
    })
    const fullWidthState = await page.evaluate(() => {
      const trigger = document.querySelector('#site-toc-trigger')
      const demoSectionIcon = document.querySelector(
        '.site-section-link[href="/demo/"] wa-icon',
      )
      const demo = document.querySelector('demo-pane[fill-height]')
      const output = demo?.shadowRoot?.querySelector('.output-container')
      const outputStyle = output instanceof HTMLElement ? globalThis.getComputedStyle(output) : null
      const actionLabels = demo instanceof HTMLElement
        ? [...demo.shadowRoot?.querySelectorAll('.editor-actions wa-button') ?? []].map((button) =>
          button.getAttribute('aria-label') ?? ''
        )
        : []
      const hasPreviewResizer = demo?.shadowRoot?.querySelector('.preview-resizer') instanceof HTMLElement
      const horizontalProbe = document.createElement('div')
      horizontalProbe.style.inlineSize = '220vw'
      horizontalProbe.style.blockSize = '1px'
      horizontalProbe.setAttribute('data-horizontal-scroll-probe', '')
      document.querySelector('.docs-content')?.append(horizontalProbe)
      const layoutAllowsHorizontalScroll = document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 2
      horizontalProbe.remove()
      if (demo instanceof HTMLElement) {
        demo.style.setProperty('--demo-pane-height', '240px')
      }
      return {
        hasDesktopSidebar: Boolean(document.querySelector('.site-toc-panel')),
        hasPageToc: Boolean(
          document.querySelector('.page-toc-panel, .page-toc-mobile'),
        ),
        triggerVisible: trigger instanceof HTMLElement &&
          globalThis.getComputedStyle(trigger).display !== 'none',
        sectionIconName: demoSectionIcon?.getAttribute('name') ?? '',
        shellColumns: globalThis.getComputedStyle(document.querySelector('.docs-shell'))
          .gridTemplateColumns,
        demoHeight: demo instanceof HTMLElement ? demo.getBoundingClientRect().height : 0,
        demoCanExceedConfiguredHeight: demo instanceof HTMLElement ? demo.getBoundingClientRect().height > 300 : false,
        demoWidth: demo instanceof HTMLElement ? demo.getBoundingClientRect().width : 0,
        articleWidth: document.querySelector('.docs-content') instanceof HTMLElement
          ? document.querySelector('.docs-content').getBoundingClientRect()
            .width
          : 0,
        layoutAllowsHorizontalScroll,
        outputOverflowX: outputStyle?.overflowX ?? '',
        outputOverflowY: outputStyle?.overflowY ?? '',
        outputHasHorizontalOverflow: output instanceof HTMLElement ? output.scrollWidth > output.clientWidth : false,
        outputHasVerticalOverflow: output instanceof HTMLElement ? output.scrollHeight > output.clientHeight : false,
        actionLabels,
        hasPreviewResizer,
      }
    })
    assert(
      !fullWidthState.hasDesktopSidebar,
      'Full-width layout rendered the desktop section sidebar',
    )
    assert(!fullWidthState.hasPageToc, 'Full-width layout rendered a page TOC')
    assert(
      fullWidthState.triggerVisible,
      'Full-width layout did not keep drawer trigger visible on desktop',
    )
    assert(
      fullWidthState.sectionIconName === 'play',
      `Demo section icon did not render: ${JSON.stringify(fullWidthState)}`,
    )
    assert(
      fullWidthState.demoWidth >= fullWidthState.articleWidth - 4,
      `Full-width demo did not fill article width: ${JSON.stringify(fullWidthState)}`,
    )
    assert(
      fullWidthState.demoHeight > 360,
      `Fill-height demo was unexpectedly short: ${JSON.stringify(fullWidthState)}`,
    )
    assert(
      fullWidthState.demoCanExceedConfiguredHeight,
      `Fill-height demo was clamped to its configured height: ${JSON.stringify(fullWidthState)}`,
    )
    assert(
      fullWidthState.actionLabels.includes('Toggle output height') &&
        fullWidthState.actionLabels.includes('Toggle editor height'),
      `Fill-height editor actions are missing resize buttons: ${JSON.stringify(fullWidthState)}`,
    )
    assert(
      fullWidthState.hasPreviewResizer,
      `Fill-height output pane is missing the drag handle: ${JSON.stringify(fullWidthState)}`,
    )
    const fillHeightDemo = page.locator('demo-pane[fill-height]').first()
    const fillHeightPreviewBefore = await getPreviewHeight(fillHeightDemo)
    await fillHeightDemo.evaluate((el) => {
      const output = el.shadowRoot?.querySelector('.output-container')
      if (!(output instanceof HTMLElement)) {
        throw new Error('Missing fill-height output container')
      }
      const filler = document.createElement('div')
      filler.style.blockSize = '900px'
      filler.setAttribute('data-output-fit-probe', '')
      filler.textContent = 'output fit probe'
      output.append(filler)
    })
    await fillHeightDemo.locator('wa-button[aria-label="Toggle output height"]').click()
    await delay(160)
    const fillHeightPreviewAfterFit = await getPreviewHeight(fillHeightDemo)
    assert(
      fillHeightPreviewAfterFit > fillHeightPreviewBefore + 80,
      `Fill-height output resize button did not resize preview: before=${fillHeightPreviewBefore}, after=${fillHeightPreviewAfterFit}`,
    )
    await fillHeightDemo.evaluate((el) => {
      el.shadowRoot?.querySelector('[data-output-fit-probe]')?.remove()
    })
    await fillHeightDemo.locator('wa-button[aria-label="Toggle output height"]').click()
    await delay(120)
    const fillHeightPreviewAfterRestore = await getPreviewHeight(fillHeightDemo)
    assert(
      Math.abs(fillHeightPreviewAfterRestore - fillHeightPreviewBefore) < 8,
      `Fill-height output resize button did not restore natural preview height: before=${fillHeightPreviewBefore}, restored=${fillHeightPreviewAfterRestore}`,
    )
    assert(
      fullWidthState.layoutAllowsHorizontalScroll,
      `Full-width layout prevented document-level horizontal scrolling: ${JSON.stringify(fullWidthState)}`,
    )
    assert(
      fullWidthState.outputOverflowX === 'auto' ||
        fullWidthState.outputOverflowX === 'scroll',
      `Output pane should own horizontal scrolling: ${JSON.stringify(fullWidthState)}`,
    )
    assert(
      fullWidthState.outputOverflowY === 'auto' ||
        fullWidthState.outputOverflowY === 'scroll',
      `Output pane should own vertical scrolling: ${JSON.stringify(fullWidthState)}`,
    )

    await page.setViewportSize({ width: 390, height: 740 })
    await page.goto(`${BASE_URL}/demo/?mobile=${Date.now()}`, {
      waitUntil: 'networkidle',
    })
    const mobileFullWidthState = await page.evaluate(() => ({
      layoutAllowsHorizontalScroll: (() => {
        const horizontalProbe = document.createElement('div')
        horizontalProbe.style.inlineSize = '220vw'
        horizontalProbe.style.blockSize = '1px'
        document.querySelector('.docs-content')?.append(horizontalProbe)
        const result = document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 2
        horizontalProbe.remove()
        return result
      })(),
      triggerVisible: document.querySelector('#site-toc-trigger') instanceof HTMLElement &&
        globalThis.getComputedStyle(document.querySelector('#site-toc-trigger'))
            .display !== 'none',
      editorVertical: document.querySelector('demo-pane')?.shadowRoot?.querySelector(
        '.editor-split',
      )?.hasAttribute(
        'vertical',
      ) ?? false,
    }))
    assert(
      mobileFullWidthState.layoutAllowsHorizontalScroll,
      `Mobile full-width layout prevented document-level horizontal scrolling: ${JSON.stringify(mobileFullWidthState)}`,
    )
    assert(
      mobileFullWidthState.triggerVisible,
      'Mobile full-width drawer trigger was not visible',
    )
    assert(
      mobileFullWidthState.editorVertical,
      'Mobile full-width demo did not switch editor split to vertical',
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
