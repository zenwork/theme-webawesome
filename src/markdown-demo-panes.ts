const demoPaneGroupPattern =
  /<!--\s*demo-pane(?<optionText>[\s\S]*?)-->\s*<pre(?:\s[^>]*)?>\s*<code(?<dataAttributes>[^>]*)>(?<data>[\s\S]*?)<\/code>\s*<\/pre>\s*<pre(?:\s[^>]*)?>\s*<code(?<templateAttributes>[^>]*)>(?<template>[\s\S]*?)<\/code>\s*<\/pre>/gi
const languageClassPattern = /(?:^|\s)language-([a-z0-9-]+)(?=\s|$)/i

const booleanOptions = new Set(['editor-open', 'fit-content', 'fill-height', 'readonly'])
const stringOptions = new Set([
  'imports',
  'default-tab',
  'layout',
  'editable',
  'data-label',
  'template-label',
  'output-background',
])
const defaultTabs = new Set(['data', 'markup', 'output'])
const layouts = new Set(['horizontal', 'tabs'])

function getAttributeValue(attributes: string, name: string): string | null {
  const attributePattern = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`,
    'i',
  )
  const match = attributes.match(attributePattern)
  if (!match) {
    return null
  }
  return match[1] ?? match[2] ?? match[3] ?? null
}

function getCodeBlockLanguage(attributes: string): string | null {
  const className = getAttributeValue(attributes, 'class')
  return className?.match(languageClassPattern)?.[1]?.toLowerCase() ?? null
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, codepoint: string) => String.fromCodePoint(parseInt(codepoint, 16)))
    .replace(/&#([0-9]+);/g, (_, codepoint: string) => String.fromCodePoint(Number(codepoint)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function escapeAttributeValue(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function normalizeFenceContent(value: string): string {
  return decodeHtmlEntities(value).replace(/\r\n/g, '\n').replace(/\n$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

interface ParsedOptions {
  attributes: string[]
  valid: boolean
}

function parseOptionTokens(optionText: string): Array<{ name: string; value: string | null }> {
  const source = optionText.trim()
  const tokens: Array<{ name: string; value: string | null }> = []
  let index = source.startsWith(':') ? 1 : 0

  while (index < source.length) {
    while (index < source.length && /[\s,]/.test(source[index])) {
      index += 1
    }

    const nameStart = index
    while (index < source.length && /[a-z0-9-]/i.test(source[index])) {
      index += 1
    }
    const name = source.slice(nameStart, index).toLowerCase()
    if (!name) {
      index += 1
      continue
    }

    while (index < source.length && /\s/.test(source[index])) {
      index += 1
    }

    if (source[index] !== '=') {
      tokens.push({ name, value: null })
      continue
    }

    index += 1
    while (index < source.length && /\s/.test(source[index])) {
      index += 1
    }

    const quote = source[index] === '"' || source[index] === "'" ? source[index] : ''
    if (quote) {
      index += 1
      const valueStart = index
      while (index < source.length && source[index] !== quote) {
        index += 1
      }
      tokens.push({ name, value: source.slice(valueStart, index) })
      if (source[index] === quote) {
        index += 1
      }
      continue
    }

    const valueStart = index
    while (index < source.length && !/[\s,]/.test(source[index])) {
      index += 1
    }
    tokens.push({ name, value: source.slice(valueStart, index) })
  }

  return tokens
}

function normalizeImports(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return '[]'
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        return JSON.stringify(parsed)
      }
    } catch {
      return null
    }
    return null
  }

  return JSON.stringify(trimmed.split(',').map((item) => item.trim()).filter(Boolean))
}

function parseDemoPaneOptions(optionText: string): ParsedOptions {
  const attributes: string[] = []

  for (const token of parseOptionTokens(optionText)) {
    const { name, value } = token
    if (booleanOptions.has(name)) {
      if (value !== null) {
        return { attributes, valid: false }
      }
      attributes.push(name)
      continue
    }

    if (!stringOptions.has(name)) {
      continue
    }

    if (value === null) {
      return { attributes, valid: false }
    }

    if (name === 'imports') {
      const imports = normalizeImports(value)
      if (imports === null) {
        return { attributes, valid: false }
      }
      attributes.push(`imports='${escapeAttributeValue(imports)}'`)
      continue
    }

    if (name === 'default-tab' && !defaultTabs.has(value)) {
      return { attributes, valid: false }
    }
    if (name === 'layout' && !layouts.has(value)) {
      return { attributes, valid: false }
    }
    if (name === 'editable' && value !== 'true' && value !== 'false') {
      return { attributes, valid: false }
    }

    attributes.push(`${name}='${escapeAttributeValue(value)}'`)
  }

  return { attributes, valid: true }
}

export function convertMarkdownDemoPaneFences(content: string): string {
  if (!content.includes('<!--') || !content.includes('demo-pane') || !content.includes('<pre')) {
    return content
  }

  return content.replace(
    demoPaneGroupPattern,
    (match, optionText = '', dataAttributes = '', dataSource = '', templateAttributes = '', templateSource = '') => {
      if (getCodeBlockLanguage(dataAttributes) !== 'json' || getCodeBlockLanguage(templateAttributes) !== 'html') {
        return match
      }

      const data = normalizeFenceContent(dataSource)
      let parsedData: unknown
      try {
        parsedData = JSON.parse(data)
      } catch {
        return match
      }
      if (!isRecord(parsedData)) {
        return match
      }

      const options = parseDemoPaneOptions(optionText)
      if (!options.valid) {
        return match
      }

      const template = normalizeFenceContent(templateSource)
      const attributes = [
        `data='${escapeAttributeValue(JSON.stringify(parsedData))}'`,
        `template='${escapeAttributeValue(template)}'`,
        ...options.attributes,
      ]

      return `<demo-pane ${attributes.join(' ')}></demo-pane>`
    },
  )
}
