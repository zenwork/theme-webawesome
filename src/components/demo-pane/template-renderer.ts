import { html, TemplateResult } from 'lit'

export interface TemplateData {
  [key: string]: unknown
}

export interface RenderedTemplate {
  template: TemplateResult
  source: string
}

const forbiddenTagPattern = /<\s*\/?\s*(script|style|iframe|object|embed|form)\b/i
const inlineEventAttributePattern = /\son[a-z0-9-]+\s*=/i
const javascriptUrlPattern = /\s(?:href|src)\s*=\s*["']?\s*javascript:/i
const litBindingAttributePattern = /(?:[@.?][^\s"'<>/=]+)\s*=\s*\$\{/i
const whitespacePattern = /\s/

/**
 * Renders an HTML template string with JS template-literal interpolation.
 * The template supports `${...}` expressions, where expression scope comes
 * from the provided data object.
 *
 * Example:
 * template: `<wa-button .value=${value} ?disabled=${disabled}>${label}</wa-button>`
 */
export function renderTemplate(template: string, data: TemplateData): RenderedTemplate {
  const normalized = sanitizeTemplateSource(normalizeTemplateSyntax(template))
  const evaluator = new Function('props', 'html', `with (props) { return html\`${normalized}\`; }`) as (
    props: TemplateData,
    htmlTag: typeof html,
  ) => TemplateResult

  return {
    template: evaluator(data, html),
    source: normalized,
  }
}

export function formatHtmlTemplate(template: string): string {
  const normalized = normalizeTemplateSyntax(template).trim()
  if (!normalized) {
    return ''
  }

  // DOMParser normalizes away Lit binding notation (`.prop`, `?attr`, `@event`).
  // Keep authoring semantics intact and apply lightweight attribute chopping.
  if (litBindingAttributePattern.test(normalized)) {
    return chopAttributesInSource(normalized)
  }

  const doc = new DOMParser().parseFromString(`<body>${normalized}</body>`, 'text/html')
  const body = doc.body
  const lines: string[] = []

  const writeNode = (node: Node, depth: number): void => {
    const indent = '  '.repeat(depth)

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        lines.push(`${indent}${text}`)
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const element = node as Element
    const attrs = [...element.attributes]
      .map((attr) => `${attr.name}="${attr.value}"`)

    if (!element.childNodes.length) {
      lines.push(...formatOpeningTag(element.tagName.toLowerCase(), attrs, indent))
      lines.push(`${indent}</${element.tagName.toLowerCase()}>`)
      return
    }

    lines.push(...formatOpeningTag(element.tagName.toLowerCase(), attrs, indent))
    for (const child of element.childNodes) {
      writeNode(child, depth + 1)
    }
    lines.push(`${indent}</${element.tagName.toLowerCase()}>`)
  }

  for (const child of body.childNodes) {
    writeNode(child, 0)
  }

  return lines.join('\n')
}

/**
 * Backwards-compatible normalization for older demo snippets.
 * `[[value]]` becomes `${value}`.
 */
function normalizeTemplateSyntax(template: string): string {
  return template.replace(/\[\[\s*([^[\]]+?)\s*\]\]/g, '${$1}')
}

function formatOpeningTag(tagName: string, attrs: string[], indent: string): string[] {
  if (!attrs.length) {
    return [`${indent}<${tagName}>`]
  }

  return [
    `${indent}<${tagName}`,
    ...attrs.map((attr) => `${indent}  ${attr}`),
    `${indent}>`,
  ]
}

function splitAttributes(attrsSource: string): string[] {
  const source = attrsSource.trim()
  if (!source) {
    return []
  }

  const attributes: string[] = []
  let token = ''
  let quote: '"' | "'" | null = null
  let braceDepth = 0

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]

    if (quote) {
      token += char
      if (char === quote && source[i - 1] !== '\\') {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      token += char
      continue
    }

    if (char === '{') {
      braceDepth += 1
      token += char
      continue
    }

    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
      token += char
      continue
    }

    if (braceDepth === 0 && whitespacePattern.test(char)) {
      if (token) {
        attributes.push(token)
        token = ''
      }
      continue
    }

    token += char
  }

  if (token) {
    attributes.push(token)
  }

  return attributes
}

function chopAttributesInSource(source: string): string {
  let output = ''
  let i = 0

  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    const lineStart = source.lastIndexOf('\n', i - 1) + 1
    const linePrefix = source.slice(lineStart, i)
    const indent = linePrefix.match(/^[ \t]*/)?.[0] ?? ''
    const startsAtLineBeginning = linePrefix === indent

    if (char !== '<' || !next || !/[a-z]/i.test(next) || !startsAtLineBeginning) {
      output += char
      i += 1
      continue
    }

    let cursor = i + 1
    while (cursor < source.length && /[a-z0-9._:-]/i.test(source[cursor])) {
      cursor += 1
    }
    const tagName = source.slice(i + 1, cursor)
    if (!tagName) {
      output += char
      i += 1
      continue
    }

    let end = cursor
    let quote: '"' | "'" | null = null
    let braceDepth = 0

    while (end < source.length) {
      const current = source[end]
      if (quote) {
        if (current === quote && source[end - 1] !== '\\') {
          quote = null
        }
      } else if (current === '"' || current === "'") {
        quote = current
      } else if (current === '{') {
        braceDepth += 1
      } else if (current === '}') {
        braceDepth = Math.max(0, braceDepth - 1)
      } else if (current === '>' && braceDepth === 0) {
        break
      }
      end += 1
    }

    if (end >= source.length || source[end] !== '>') {
      output += source.slice(i)
      break
    }

    const inside = source.slice(cursor, end)
    const rawTrimmed = inside.trim()
    const selfClosing = rawTrimmed.endsWith('/')
    const attrsSource = selfClosing ? rawTrimmed.slice(0, -1).trim() : rawTrimmed
    const attrs = splitAttributes(attrsSource)

    if (!attrs.length) {
      output += source.slice(i, end + 1)
      i = end + 1
      continue
    }

    output += `${indent}<${tagName}\n`
    output += attrs.map((attr) => `${indent}  ${attr}`).join('\n')
    output += `\n${indent}${selfClosing ? '/>' : '>'}`
    i = end + 1
  }

  return output
}

function sanitizeTemplateSource(template: string): string {
  if (forbiddenTagPattern.test(template)) {
    throw new Error('Template contains a forbidden HTML tag')
  }
  if (inlineEventAttributePattern.test(template)) {
    throw new Error('Inline event attributes are not allowed; use Lit @event bindings')
  }
  if (javascriptUrlPattern.test(template)) {
    throw new Error('javascript: URLs are not allowed in templates')
  }
  return template
}

/**
 * Escapes HTML special characters
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Validates JSON string
 * @param str - JSON string to validate
 * @returns Parsed object or null if invalid
 */
export function parseJSON(str: string): TemplateData | null {
  try {
    const parsed = JSON.parse(str)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed as TemplateData
  } catch {
    return null
  }
}
