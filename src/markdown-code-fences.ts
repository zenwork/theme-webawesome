import { normalizeLanguage } from './components/code-example-language.ts'

const markdownCodeBlockPattern =
  /(?<options><!--\s*code-example(?<optionText>[\s\S]*?)-->\s*)?<pre(?:\s[^>]*)?>\s*<code(?<attributes>[^>]*)>(?<code>[\s\S]*?)<\/code>\s*<\/pre>/gi
const languageClassPattern = /(?:^|\s)language-([a-z0-9-]+)(?=\s|$)/i
const optionSeparatorPattern = /[\s,]+/

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
  const classLanguage = className?.match(languageClassPattern)?.[1]
  if (classLanguage) {
    return classLanguage
  }

  return getAttributeValue(attributes, 'data-language') ?? getAttributeValue(attributes, 'language')
}

function getCodeExampleOptionAttributes(optionText: string): string {
  const options = optionText
    .replace(/^:/, '')
    .trim()
    .split(optionSeparatorPattern)
    .filter(Boolean)
  const attributes: string[] = []

  if (options.includes('padded')) {
    attributes.push('padded')
  }
  if (options.includes('no-line-numbers')) {
    attributes.push('no-line-numbers')
  }

  return attributes.length ? ` ${attributes.join(' ')}` : ''
}

export function convertMarkdownCodeFencesToCodeExamples(content: string): string {
  if (!content.includes('<pre') || !content.includes('<code')) {
    return content
  }

  return content.replace(
    markdownCodeBlockPattern,
    (match, _options = '', optionText = '', attributes = '', code = '') => {
      const language = normalizeLanguage(getCodeBlockLanguage(attributes))
      if (!language) {
        return match
      }

      const optionAttributes = getCodeExampleOptionAttributes(optionText)
      return `<code-example language="${language}"${optionAttributes}>${code}</code-example>`
    },
  )
}
