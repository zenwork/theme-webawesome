import { describe, expect, it } from 'vitest'
import { normalizeLanguage } from './components/code-example-language.ts'
import { convertMarkdownCodeFencesToCodeExamples } from './markdown-code-fences.ts'

describe('code-example language helpers', () => {
  it('normalizes supported language aliases', () => {
    expect(normalizeLanguage('ts')).toBe('typescript')
    expect(normalizeLanguage('JS')).toBe('javascript')
    expect(normalizeLanguage('plaintext')).toBe('text')
  })

  it('rejects unsupported languages', () => {
    expect(normalizeLanguage('bash')).toBeNull()
  })
})

describe('convertMarkdownCodeFencesToCodeExamples', () => {
  it('converts supported markdown code block languages', () => {
    const html = '<pre><code class="language-ts">const ready = true\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(
      '<code-example language="typescript">const ready = true\n</code-example>',
    )
  })

  it('preserves JSX-like escaped content when converting tsx', () => {
    const html =
      '<pre><code class="language-tsx">export const view = &lt;wa-badge variant="success"&gt;Ready&lt;/wa-badge&gt;\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(
      '<code-example language="tsx">export const view = &lt;wa-badge variant="success"&gt;Ready&lt;/wa-badge&gt;\n</code-example>',
    )
  })

  it('preserves JSON quotes and entities inside converted blocks', () => {
    const html =
      '<pre><code class="language-json">{&quot;name&quot;:&quot;theme-webawesome&quot;,&quot;ready&quot;:true}\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(
      '<code-example language="json">{&quot;name&quot;:&quot;theme-webawesome&quot;,&quot;ready&quot;:true}\n</code-example>',
    )
  })

  it('leaves unsupported languages unchanged', () => {
    const html = '<pre><code class="language-bash">deno task build\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(html)
  })

  it('adds padded from an immediately preceding code-example comment', () => {
    const html = '<!-- code-example padded -->\n<pre><code class="language-ts">const ready = true\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(
      '<code-example language="typescript" padded>const ready = true\n</code-example>',
    )
  })

  it('adds no-line-numbers from an immediately preceding code-example comment', () => {
    const html =
      '<!-- code-example no-line-numbers -->\n<pre><code class="language-js">const ready = true\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(
      '<code-example language="javascript" no-line-numbers>const ready = true\n</code-example>',
    )
  })

  it('adds multiple supported option attributes from a code-example comment', () => {
    const html =
      '<!-- code-example: padded no-line-numbers -->\n<pre><code class="language-json">{&quot;ready&quot;:true}\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(
      '<code-example language="json" padded no-line-numbers>{&quot;ready&quot;:true}\n</code-example>',
    )
  })

  it('keeps code-example option comments when the code block language is unsupported', () => {
    const html =
      '<!-- code-example padded no-line-numbers -->\n<pre><code class="language-bash">deno task build\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(html)
  })

  it('leaves unlabeled code blocks unchanged', () => {
    const html = '<pre><code>plain code\n</code></pre>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(html)
  })

  it('does not modify existing code-example blocks', () => {
    const html = '<code-example language="typescript">const ready = true</code-example>'

    expect(convertMarkdownCodeFencesToCodeExamples(html)).toBe(html)
  })
})
