/**
 * Simple mustache-style template renderer
 * Replaces {{key}} placeholders with values from data object
 * Supports nested properties like {{props.variant}}
 */

export interface TemplateData {
  [key: string]: string | number | boolean | TemplateData | Array<string | number | boolean | TemplateData>
}

/**
 * Renders a template string with mustache-style placeholders
 * @param template - Template string with {{placeholder}} syntax
 * @param data - Data object with values to replace
 * @returns Rendered string
 */
export function renderTemplate(template: string, data: TemplateData): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path.trim())
    return value !== undefined ? String(value) : match
  })
}

/**
 * Gets a nested value from an object using dot notation
 * @param obj - Source object
 * @param path - Dot-separated path (e.g., "props.variant")
 * @returns The value at the path or undefined
 */
function getNestedValue(obj: TemplateData, path: string): string | number | boolean | undefined {
  const keys = path.split('.')
  let current: TemplateData | string | number | boolean | Array<string | number | boolean | TemplateData> = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = current[key]
    } else {
      return undefined
    }
  }

  return typeof current === 'object' ? undefined : current
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
    return JSON.parse(str)
  } catch {
    return null
  }
}
