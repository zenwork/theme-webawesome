import Handlebars from 'handlebars'

export interface TemplateData {
  [key: string]: unknown
}

/**
 * Renders a template string with Handlebars syntax.
 * Supports conditionals, loops, and nested property access.
 * Also supports legacy [[key]] placeholders by converting them to {{key}}.
 *
 * @param template - Template string with Handlebars syntax
 * @param data - Data object with values to replace
 * @returns Rendered string
 */
export function renderTemplate(template: string, data: TemplateData): string {
  const normalized = normalizeTemplateSyntax(template)
  const compiled = Handlebars.compile(normalized, {
    noEscape: false,
    strict: true,
  })
  return compiled(data)
}

/**
 * Converts legacy [[key]] placeholders to Handlebars {{key}} placeholders.
 */
function normalizeTemplateSyntax(template: string): string {
  return template.replace(/\[\[\s*([^[\]]+?)\s*\]\]/g, '{{$1}}')
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
