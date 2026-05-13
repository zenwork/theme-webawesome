import lightningcss from 'lume/plugins/lightningcss.ts'
import basePath from 'lume/plugins/base_path.ts'
import metas from 'lume/plugins/metas.ts'
import nav from 'lume/plugins/nav.ts'
import { Options as SitemapOptions, sitemap } from 'lume/plugins/sitemap.ts'
import { favicon, Options as FaviconOptions } from 'lume/plugins/favicon.ts'
import { merge } from 'lume/core/utils/object.ts'
import createSlugifier from 'lume/core/slugifier.ts'
import esbuild from 'lume/plugins/esbuild.ts'
import toc from 'https://deno.land/x/lume_markdown_plugins@v0.9.0/toc.ts'

import 'lume/types.ts'

export interface WebAwesomeOptions {
  mode?: 'free' | 'pro'
  assetBasePath?: string
  cssPath?: string
  loaderPath?: string
  splitPanelPath?: string
}

export interface Options {
  sitemap?: Partial<SitemapOptions>
  favicon?: Partial<FaviconOptions>
  webawesome?: WebAwesomeOptions
  componentEntrypoint?: string
  additionalComponentEntrypoints?: string[]
}

interface ResolvedWebAwesomeOptions {
  mode: 'free' | 'pro'
  assetBasePath: string
  cssPath: string
  loaderPath: string
  splitPanelPath: string
}

interface TocNode {
  level: number
  text: string
  slug: string
  url: string
  children: TocNode[]
}

export const defaults: Options = {
  favicon: {
    input: 'uploads/favicon.svg',
  },
  webawesome: {
    mode: 'free',
    assetBasePath: '/lib/webawesome/dist-cdn',
  },
  componentEntrypoint: 'components/index.ts',
  additionalComponentEntrypoints: [],
}

const headingPattern = /<h([2-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi
const headingIdPattern = /\sid=(["'])(.*?)\1/i
const stripTagsPattern = /<[^>]*>/g
const collapseWhitespacePattern = /\s+/g
const slugifyHeading = createSlugifier()

function toScriptPath(entrypoint: string): string {
  if (entrypoint.endsWith('.ts')) {
    return `/${entrypoint.slice(0, -3)}.js`
  }
  if (entrypoint.endsWith('.js')) {
    return `/${entrypoint}`
  }
  return `/${entrypoint}.js`
}

function getHeadingText(markup: string): string {
  return markup
    .replace(stripTagsPattern, ' ')
    .replace(collapseWhitespacePattern, ' ')
    .trim()
}

function getUniqueSlug(slug: string, used: Set<string>): string {
  const base = slug || 'section'
  let next = base
  let suffix = 1

  while (used.has(next)) {
    next = `${base}-${suffix}`
    suffix += 1
  }

  used.add(next)
  return next
}

function buildHtmlToc(content: string, pageUrl: string | undefined, minLevel = 2): { content: string; toc: TocNode[] } {
  const root: TocNode = { level: 0, text: '', slug: '', url: '', children: [] }
  const stack: TocNode[] = [root]
  const usedSlugs = new Set<string>()
  const toc: TocNode[] = root.children

  const withHeadingIds = content.replace(headingPattern, (match, levelRaw, attributes = '', innerMarkup = '') => {
    const level = Number(levelRaw)

    if (level < minLevel) {
      return match
    }

    const text = getHeadingText(innerMarkup)
    if (!text) {
      return match
    }

    const existingId = attributes.match(headingIdPattern)?.[2]?.trim()
    const slug = getUniqueSlug(existingId || slugifyHeading(text), usedSlugs)
    const url = pageUrl ? `${pageUrl}#${slug}` : `#${slug}`
    const node: TocNode = { level, text, slug, url, children: [] }

    if (node.level > stack[0].level) {
      stack[0].children.push(node)
      stack.unshift(node)
    } else if (node.level === stack[0].level) {
      stack[1].children.push(node)
      stack[0] = node
    } else {
      while (node.level <= stack[0].level) {
        stack.shift()
      }
      stack[0].children.push(node)
      stack.unshift(node)
    }

    const nextAttributes = headingIdPattern.test(attributes)
      ? attributes.replace(headingIdPattern, ` id="${slug}"`)
      : `${attributes} id="${slug}"`

    return `<h${levelRaw}${nextAttributes}>${innerMarkup}</h${levelRaw}>`
  })

  return {
    content: withHeadingIds,
    toc,
  }
}

/** Configure the site */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions)
  const basePathByMode: Record<'free' | 'pro', string> = {
    free: '/lib/webawesome/dist-cdn',
    pro: '/lib/webawesome-pro/dist-cdn',
  }

  const mode = options.webawesome?.mode ?? 'free'
  const assetBasePath = options.webawesome?.assetBasePath ?? basePathByMode[mode]
  const webawesome: ResolvedWebAwesomeOptions = {
    mode,
    assetBasePath,
    cssPath: options.webawesome?.cssPath ?? `${assetBasePath}/styles/webawesome.css`,
    loaderPath: options.webawesome?.loaderPath ?? `${assetBasePath}/webawesome.loader.js`,
    splitPanelPath: options.webawesome?.splitPanelPath ?? `${assetBasePath}/components/split-panel/split-panel.js`,
  }
  const componentEntrypoints = [
    options.componentEntrypoint ?? 'components/index.ts',
    ...(options.additionalComponentEntrypoints ?? []),
  ]
  const componentScripts = componentEntrypoints.map(toScriptPath)

  return (site: Lume.Site) => {
    site.preprocess(['.html'], (pages) => {
      for (const page of pages) {
        const content = typeof page.data.content === 'string' ? page.data.content : ''

        if (!content.includes('<h')) {
          continue
        }

        const { content: nextContent, toc: htmlToc } = buildHtmlToc(content, page.data.url)

        if (!htmlToc.length) {
          continue
        }

        page.data.content = nextContent
        page.data.toc = htmlToc
      }
    })

    site.data('webawesome', webawesome)
    site.data('themeComponents', {
      entrypoints: componentEntrypoints,
      scripts: componentScripts,
      primaryScript: componentScripts[0],
    })

    site
      .use(lightningcss())
      .use(basePath())
      .use(nav())
      .use(metas())
      .use(toc())
      .use(sitemap(options.sitemap))
      .use(favicon(options.favicon))
      // deno-lint-ignore lume/plugin-order
      .use(esbuild({
        extensions: ['.ts', '.js'],
        options: {
          bundle: true,
          format: 'esm',
          minify: false,
          keepNames: true,
          splitting: true,
          platform: 'browser',
          tsconfigRaw: {
            compilerOptions: {
              experimentalDecorators: true,
            },
          },
        },
      }))
      .add('style.css')
      .add(options.componentEntrypoint ?? 'components/index.ts')
      // .copy("npm:@awesome.me/webawesome@^3.1.0/dist/styles/**/*.css", "styles/webawesome")
      .copy('lib', 'lib')

    for (const entrypoint of options.additionalComponentEntrypoints ?? []) {
      site.add(entrypoint)
    }
  }
}
