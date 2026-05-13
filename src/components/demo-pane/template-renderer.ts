export interface TemplateData {
  [key: string]: unknown
}

/**
 * Renders an HTML template string with JS template-literal interpolation.
 * The template supports `${...}` expressions, where expression scope comes
 * from the provided data object.
 *
 * Example:
 * template: `<wa-button variant="${variant}">${label}</wa-button>`
 */
export function renderTemplate(template: string, data: TemplateData): string {
  const normalized = normalizeTemplateSyntax(template)
  const escaped = normalized.replaceAll('\\', '\\\\')
  const evaluator = new Function(
    'props',
    `with (props) { return \`${escaped}\`; }`,
  ) as (props: TemplateData) => string
  return evaluator(data)
}

export function formatHtmlTemplate(template: string): string {
  const normalized = normalizeTemplateSyntax(template).trim()
  if (!normalized) {
    return ''
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
      .map((attr) => ` ${attr.name}="${attr.value}"`)
      .join('')

    if (!element.childNodes.length) {
      lines.push(`${indent}<${element.tagName.toLowerCase()}${attrs}></${element.tagName.toLowerCase()}>`)
      return
    }

    lines.push(`${indent}<${element.tagName.toLowerCase()}${attrs}>`)
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
