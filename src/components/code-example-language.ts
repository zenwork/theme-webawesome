export const codeExampleLanguages = ['json', 'html', 'javascript', 'typescript', 'jsx', 'tsx', 'css', 'text'] as const

export type CodeExampleLanguage = typeof codeExampleLanguages[number]

const languageAliases = {
  css: 'css',
  html: 'html',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  markup: 'html',
  plaintext: 'text',
  text: 'text',
  ts: 'typescript',
  tsx: 'tsx',
  txt: 'text',
  typescript: 'typescript',
} as const satisfies Record<string, CodeExampleLanguage>

export function normalizeLanguage(value?: string | null): CodeExampleLanguage | null {
  if (!value) {
    return null
  }
  const normalized = value.trim().toLowerCase()
  return languageAliases[normalized as keyof typeof languageAliases] ?? null
}
