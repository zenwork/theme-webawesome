import { describe, expect, it } from 'vitest'
import { convertMarkdownCodeFencesToCodeExamples } from './markdown-code-fences.ts'
import { convertMarkdownDemoPaneFences } from './markdown-demo-panes.ts'

describe('convertMarkdownDemoPaneFences', () => {
  it('converts a demo-pane comment with json and html fences', () => {
    const html = [
      '<!-- demo-pane imports="button,badge" default-tab="output" editor-open -->',
      '<pre><code class="language-json">{&quot;label&quot;:&quot;Deploy&quot;,&quot;variant&quot;:&quot;brand&quot;}</code></pre>',
      '<pre><code class="language-html">&lt;wa-button variant="${variant}"&gt;${label}&lt;/wa-button&gt;</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(
      '<demo-pane data=\'{"label":"Deploy","variant":"brand"}\' template=\'&lt;wa-button variant="${variant}"&gt;${label}&lt;/wa-button&gt;\' imports=\'["button","badge"]\' default-tab=\'output\' editor-open></demo-pane>',
    )
  })

  it('allows Lit interpolation and binding syntax in the html fence', () => {
    const html = [
      '<!-- demo-pane -->',
      '<pre><code class="language-json">{&quot;patient&quot;:{&quot;id&quot;:&quot;123&quot;},&quot;disabled&quot;:false}</code></pre>',
      '<pre><code class="language-html">&lt;fhir-patient .data=${patient} ?disabled=${disabled} @select=${handleSelect}&gt;${patient.id}&lt;/fhir-patient&gt;</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(
      '<demo-pane data=\'{"patient":{"id":"123"},"disabled":false}\' template=\'&lt;fhir-patient .data=${patient} ?disabled=${disabled} @select=${handleSelect}&gt;${patient.id}&lt;/fhir-patient&gt;\'></demo-pane>',
    )
  })

  it('preserves valid json-array imports', () => {
    const html = [
      '<!-- demo-pane imports=\'["button","badge"]\' -->',
      '<pre><code class="language-json">{}</code></pre>',
      '<pre><code class="language-html">&lt;wa-button&gt;Deploy&lt;/wa-button&gt;</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(
      "<demo-pane data='{}' template='&lt;wa-button&gt;Deploy&lt;/wa-button&gt;' imports='[\"button\",\"badge\"]'></demo-pane>",
    )
  })

  it('emits supported boolean and string attributes', () => {
    const html = [
      '<!-- demo-pane layout="tabs" default-tab="markup" editable="false" data-label="Scope" template-label="Markup" output-background="white" fit-content fill-height readonly -->',
      '<pre><code class="language-json">{&quot;ready&quot;:true}</code></pre>',
      '<pre><code class="language-html">&lt;wa-badge&gt;${ready}&lt;/wa-badge&gt;</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(
      "<demo-pane data='{\"ready\":true}' template='&lt;wa-badge&gt;${ready}&lt;/wa-badge&gt;' layout='tabs' default-tab='markup' editable='false' data-label='Scope' template-label='Markup' output-background='white' fit-content fill-height readonly></demo-pane>",
    )
  })

  it('leaves invalid json unchanged', () => {
    const html = [
      '<!-- demo-pane -->',
      '<pre><code class="language-json">{"ready":true</code></pre>',
      '<pre><code class="language-html">&lt;wa-badge&gt;Ready&lt;/wa-badge&gt;</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(html)
  })

  it('leaves non-object json unchanged', () => {
    const html = [
      '<!-- demo-pane -->',
      '<pre><code class="language-json">[&quot;ready&quot;]</code></pre>',
      '<pre><code class="language-html">&lt;wa-badge&gt;Ready&lt;/wa-badge&gt;</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(html)
  })

  it('leaves a group with a non-html second fence unchanged', () => {
    const html = [
      '<!-- demo-pane -->',
      '<pre><code class="language-json">{}</code></pre>',
      '<pre><code class="language-ts">const ready = true</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(html)
  })

  it('leaves a group missing the second fence unchanged', () => {
    const html = [
      '<!-- demo-pane -->',
      '<pre><code class="language-json">{}</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(html)
  })

  it('leaves a group with invalid known option values unchanged', () => {
    const html = [
      '<!-- demo-pane default-tab="preview" -->',
      '<pre><code class="language-json">{}</code></pre>',
      '<pre><code class="language-html">&lt;wa-button&gt;Deploy&lt;/wa-button&gt;</code></pre>',
    ].join('\n')

    expect(convertMarkdownDemoPaneFences(html)).toBe(html)
  })

  it('prevents grouped fences from becoming separate code-example blocks when run first', () => {
    const html = [
      '<!-- demo-pane -->',
      '<pre><code class="language-json">{&quot;ready&quot;:true}</code></pre>',
      '<pre><code class="language-html">&lt;wa-badge&gt;${ready}&lt;/wa-badge&gt;</code></pre>',
    ].join('\n')

    const converted = convertMarkdownCodeFencesToCodeExamples(convertMarkdownDemoPaneFences(html))

    expect(converted).toBe(
      "<demo-pane data='{\"ready\":true}' template='&lt;wa-badge&gt;${ready}&lt;/wa-badge&gt;'></demo-pane>",
    )
  })
})
