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
  customPropertiesCssPath?: string
  loaderPath?: string
  splitPanelPath?: string
}

export interface SiteTocOptions {
  root: string
  sections?: { folder: string; label: string; order: number }[]
  includeUrlPrefix?: string
  filter?: string
}

export interface Options {
  sitemap?: Partial<SitemapOptions>
  favicon?: Partial<FaviconOptions>
  webawesome?: WebAwesomeOptions
  siteToc?: SiteTocOptions
  componentEntrypoint?: string
  additionalComponentEntrypoints?: string[]
}

interface ResolvedWebAwesomeOptions {
  mode: 'free' | 'pro'
  assetBasePath: string
  cssPath: string
  customPropertiesCssPath?: string
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

interface ThemeSectionLink {
  key: string
  title: string
  indexTitle: string
  baseUrl: string
  url: string
  order: number
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

const siteTocDefaults: SiteTocOptions = {
  root: '.',
  sections: [{ folder: 'src', label: 'Home', order: 0 }],
  includeUrlPrefix: '/',
}

const headingPattern = /<h([2-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi
const headingIdPattern = /\sid=(["'])(.*?)\1/i
const stripTagsPattern = /<[^>]*>/g
const collapseWhitespacePattern = /\s+/g
const absoluteUrlPattern = /^(?:[a-z]+:)?\/\//i
const freeWebAwesomeAssetSource = 'npm:@awesome.me/webawesome@^3.1.0/dist-cdn/**'
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

function normalizeUrlPrefix(prefix: string): string {
  const trimmed = prefix.trim()

  if (!trimmed) {
    return '/'
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function normalizeSectionKey(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const firstSegment = trimmed
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)[0]

  return firstSegment || ''
}

function normalizeSiteRoot(root: string): string {
  const trimmed = root.trim()
  if (!trimmed || trimmed === '.') {
    return '/'
  }

  if (trimmed === '/' || trimmed.startsWith('/')) {
    throw new Error(
      'theme-webawesome: `siteToc.root` must be a relative path from the current working directory. Use `.` for root.',
    )
  }

  const normalizedRelativeRoot = trimmed.replace(/\\/g, '/').replace(/^\.\//, '')
  return normalizeUrlPrefix(normalizedRelativeRoot)
}

function normalizeFolder(folder: string): string {
  return folder.trim().replace(/^\/+|\/+$/g, '')
}

function normalizePageUrl(url: string): string {
  const withLeadingSlash = url.startsWith('/') ? url : `/${url}`
  const withoutHash = withLeadingSlash.split('#')[0]
  const withoutQuery = withoutHash.split('?')[0]
  return withoutQuery.endsWith('/') ? withoutQuery : `${withoutQuery}/`
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function resolveSiteTocOptions(config?: Partial<SiteTocOptions>): SiteTocOptions {
  const normalizedSections = config?.sections
    ?.map((section) => ({
      folder: normalizeFolder(section.folder),
      label: section.label.trim(),
      order: section.order,
    }))
    .filter((section) => section.folder && section.label)

  const sections = normalizedSections?.length ? normalizedSections : siteTocDefaults.sections
  if (!sections?.length) {
    throw new Error('theme-webawesome: `siteToc.sections` must include at least one section definition.')
  }

  return {
    root: (config?.root || siteTocDefaults.root).trim() || siteTocDefaults.root,
    sections,
    includeUrlPrefix: config?.includeUrlPrefix ?? siteTocDefaults.includeUrlPrefix,
    filter: config?.filter?.trim() || undefined,
  }
}

function getRelativeSegmentsFromRoot(url: string, rootUrl: string): string[] | null {
  const normalizedUrl = normalizePageUrl(url)
  if (rootUrl !== '/' && !normalizedUrl.startsWith(rootUrl)) {
    return null
  }

  const relative = rootUrl === '/' ? normalizedUrl : normalizedUrl.slice(rootUrl.length)
  return relative.split('/').filter(Boolean)
}

function toSectionBaseUrl(rootUrl: string, folder: string): string {
  const normalizedFolder = normalizeFolder(folder)
  if (!normalizedFolder) {
    return rootUrl
  }
  return rootUrl === '/' ? `/${normalizedFolder}/` : `${rootUrl}${normalizedFolder}/`
}

function buildHtmlToc(content: string, minLevel = 2): { content: string; toc: TocNode[] } {
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
    const url = `#${slug}`
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
  const siteTocOptions = resolveSiteTocOptions(userOptions?.siteToc)
  const siteTocRootUrl = normalizeSiteRoot(siteTocOptions.root)
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
    customPropertiesCssPath: options.webawesome?.customPropertiesCssPath,
    loaderPath: options.webawesome?.loaderPath ?? `${assetBasePath}/webawesome.loader.js`,
    splitPanelPath: options.webawesome?.splitPanelPath ?? `${assetBasePath}/components/split-panel/split-panel.js`,
  }
  const componentEntrypoints = [
    options.componentEntrypoint ?? 'components/index.ts',
    ...(options.additionalComponentEntrypoints ?? []),
  ]
  const componentScripts = componentEntrypoints.map(toScriptPath)
  const configuredSections = (siteTocOptions.sections ?? [])
    .map((section) => ({
      key: normalizeSectionKey(section.folder),
      folder: normalizeFolder(section.folder),
      title: section.label.trim(),
      order: section.order,
    }))
    .filter((section) => section.key && section.folder && section.title)
  if (!configuredSections.length) {
    throw new Error('theme-webawesome: `siteToc.sections` must include at least one valid section.')
  }

  const sectionNavigation = configuredSections.length > 1
  const primarySection = !sectionNavigation ? configuredSections[0] : undefined
  const siteTocBaseUrl = primarySection ? toSectionBaseUrl(siteTocRootUrl, primarySection.folder) : siteTocRootUrl
  const siteTocFilter = siteTocOptions.filter
    ? siteTocOptions.filter
    : `hide_menu!=true url^=${
      normalizeUrlPrefix(primarySection?.folder ? siteTocBaseUrl : (siteTocOptions.includeUrlPrefix ?? siteTocBaseUrl))
    }`
  const themeSections: ThemeSectionLink[] = []

  function buildThemeSections(pages: Lume.Data[]): ThemeSectionLink[] {
    const sections = [...configuredSections]
      .sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order
        }
        return a.title.localeCompare(b.title)
      })

    return sections.map((section) => {
      const sectionBaseUrl = toSectionBaseUrl(siteTocRootUrl, section.folder)
      const entrypointCandidates: Array<{ url: string; order: number; title: string; pathDepth: number }> = []

      for (const page of pages) {
        if (page.data.hide_menu === true) {
          continue
        }

        const urlValue = page.data.url
        if (typeof urlValue !== 'string' || !urlValue.startsWith('/')) {
          continue
        }

        const normalizedUrl = normalizePageUrl(urlValue)
        if (!normalizedUrl.startsWith(sectionBaseUrl)) {
          continue
        }

        const relativeSegments = getRelativeSegmentsFromRoot(normalizedUrl, sectionBaseUrl) ?? []
        entrypointCandidates.push({
          url: normalizedUrl,
          order: typeof page.data.order === 'number' ? page.data.order : Number.POSITIVE_INFINITY,
          title: typeof page.data.title === 'string' ? page.data.title.trim() : '',
          pathDepth: relativeSegments.length,
        })
      }

      const directSectionEntry = entrypointCandidates.find((candidate) => candidate.url === sectionBaseUrl)
      const [sortedEntrypoint] = entrypointCandidates.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order
        }
        if (a.pathDepth !== b.pathDepth) {
          return a.pathDepth - b.pathDepth
        }
        return a.url.localeCompare(b.url)
      })
      const entrypoint = directSectionEntry ?? sortedEntrypoint

      return {
        key: section.key,
        title: section.title || toTitleCase(section.key),
        indexTitle: entrypoint?.title || section.title || toTitleCase(section.key),
        baseUrl: entrypointCandidates.length ? sectionBaseUrl : siteTocRootUrl,
        url: entrypoint?.url || (entrypointCandidates.length ? sectionBaseUrl : siteTocRootUrl),
        order: section.order,
      }
    })
  }

  function getThemeNavigationSnapshot() {
    return {
      siteTocFilter,
      rootUrl: siteTocBaseUrl,
      sections: [...themeSections],
    }
  }

  return (site: Lume.Site) => {
    site.preprocess(['.html'], (pages) => {
      for (const page of pages) {
        const content = typeof page.data.content === 'string' ? page.data.content : ''

        if (!content.includes('<h')) {
          continue
        }

        const { content: nextContent, toc: htmlToc } = buildHtmlToc(content)

        if (!htmlToc.length) {
          continue
        }

        page.data.content = nextContent
        page.data.toc = htmlToc
      }

      const resolvedSections = buildThemeSections(pages)
      const navigationSections = sectionNavigation ? resolvedSections : resolvedSections.slice(0, 1)
      themeSections.splice(0, themeSections.length, ...navigationSections)

      const navigation = getThemeNavigationSnapshot()
      for (const page of pages) {
        page.data.themeNavigation = navigation
      }
    })

    site.data('webawesome', webawesome)
    site.data('themeComponents', {
      entrypoints: componentEntrypoints,
      scripts: componentScripts,
      primaryScript: componentScripts[0],
    })
    site.data('themeNavigation', getThemeNavigationSnapshot())

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

    if (webawesome.mode === 'free' && !absoluteUrlPattern.test(webawesome.assetBasePath)) {
      site.copy(freeWebAwesomeAssetSource, webawesome.assetBasePath.replace(/^\//, ''))
    }

    if (webawesome.customPropertiesCssPath && !absoluteUrlPattern.test(webawesome.customPropertiesCssPath)) {
      site.add(webawesome.customPropertiesCssPath.replace(/^\//, ''))
    }

    for (const entrypoint of options.additionalComponentEntrypoints ?? []) {
      site.add(entrypoint)
    }
  }
}
