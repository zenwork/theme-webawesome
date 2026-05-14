import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const TEST_PORT = 3311
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`
const ROOT_DIR = new URL('../../', import.meta.url)

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
      if (response.ok) {
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
  const child = spawn('deno', ['task', 'lume', '-s', '--port', String(TEST_PORT)], {
    cwd: ROOT_DIR,
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

async function setJson(host, value) {
  const jsonEditor = host.locator('#json-editor .cm-content')
  await jsonEditor.click()
  await jsonEditor.page().keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await jsonEditor.page().keyboard.type(value)
}

async function setTemplate(host, value) {
  const templateEditor = host.locator('#template-editor .cm-content')
  await templateEditor.click()
  await templateEditor.page().keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await templateEditor.page().keyboard.type(value)
}

function getTemplateDoc(host) {
  return host.evaluate((el) => el._templateEditor?.state.doc.toString() ?? '')
}

async function run() {
  const server = startServer()
  let browser
  try {
    await waitForServer(`${BASE_URL}/`)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`${BASE_URL}/?t=${Date.now()}`, { waitUntil: 'networkidle' })

    const host = page.locator('demo-pane').first()
    await host.waitFor()

    const initial = await getOutputText(host)
    assert(initial.includes('Release v0.2.0'), `Unexpected initial output: ${initial}`)

    await setJson(
      host,
      `{
  "label": "Updated Label",
  "variant": "brand",
  "size": "medium"
}`,
    )
    await host.locator('wa-button:has-text("Run")').click()
    await delay(300)
    const updated = await getOutputText(host)
    assert(updated.includes('Updated Label'), `Run did not update output: ${updated}`)

    await setJson(host, `{"label":"Broken"`)
    await host.locator('wa-button:has-text("Run")').click()
    await delay(200)
    const error = await getErrorText(host)
    assert(error.includes('Invalid JSON data'), `Expected invalid JSON error, got: ${error}`)

    await setTemplate(host, `<div><wa-button variant="${'${variant}'}">${'${label}'}</wa-button></div>`)
    await host.locator('wa-button:has-text("Format HTML")').click()
    await delay(200)
    const formattedTemplate = await getTemplateDoc(host)
    assert(
      formattedTemplate.includes('\n  <wa-button') && formattedTemplate.includes('\n</div>'),
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
    await host.locator('wa-button:has-text("Run")').click()
    await delay(250)
    const subtitleOutput = await getOutputText(host)
    assert(subtitleOutput.includes('Live Preview'), `Nested/optional expression failed: ${subtitleOutput}`)

    await setTemplate(
      host,
      `<ul>\${items.map((item) => '<li>' + item + '</li>').join('')}</ul>`,
    )
    await host.locator('wa-button:has-text("Run")').click()
    await delay(250)
    const listOutput = await getOutputText(host)
    assert(listOutput.includes('Alpha') && listOutput.includes('Beta'), `Array expression failed: ${listOutput}`)

    await setTemplate(
      host,
      `<ul>\${items.map((item) => \`<li>\${item}</li>\`).join('')}</ul>`,
    )
    await host.locator('wa-button:has-text("Run")').click()
    await delay(250)
    const nestedTemplateOutput = await getOutputText(host)
    assert(
      nestedTemplateOutput.includes('Alpha') && nestedTemplateOutput.includes('Beta'),
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
    await host.locator('wa-button:has-text("Run")').click()
    await delay(250)
    const litBindingState = await host.evaluate((el) => {
      const button = el.shadowRoot?.querySelector('.output-container wa-button')
      if (!(button instanceof HTMLElement)) {
        return null
      }
      return {
        disabled: button.disabled === true,
        title: button.title,
      }
    })
    assert(litBindingState?.disabled, `Boolean Lit binding did not apply: ${JSON.stringify(litBindingState)}`)
    assert(
      litBindingState?.title === 'Bound via .title',
      `Property Lit binding did not apply: ${JSON.stringify(litBindingState)}`,
    )
    await host.evaluate((el) => {
      const button = el.shadowRoot?.querySelector('.output-container wa-button')
      if (button instanceof HTMLElement) {
        button.click()
      }
    })
    const clickedState = await host.evaluate((el) => {
      const button = el.shadowRoot?.querySelector('.output-container wa-button')
      return button instanceof HTMLElement ? button.getAttribute('data-clicked') : null
    })
    assert(clickedState === 'yes', `Event Lit binding did not apply: ${clickedState}`)

    const customElementDemo = page.locator('demo-pane').nth(2)
    await customElementDemo.waitFor()
    const customOutputHtml = await customElementDemo.evaluate((el) => {
      const output = el.shadowRoot?.querySelector('.output-container')
      return output?.innerHTML ?? ''
    })
    assert(
      customOutputHtml.includes('<demo-status-pill') && customOutputHtml.includes('Custom element renders'),
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
