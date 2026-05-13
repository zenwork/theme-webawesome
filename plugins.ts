import lightningcss from 'lume/plugins/lightningcss.ts'
import basePath from 'lume/plugins/base_path.ts'
import metas from 'lume/plugins/metas.ts'
import nav from 'lume/plugins/nav.ts'
import { Options as SitemapOptions, sitemap } from 'lume/plugins/sitemap.ts'
import { favicon, Options as FaviconOptions } from 'lume/plugins/favicon.ts'
import { merge } from 'lume/core/utils/object.ts'
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

export const defaults: Options = {
  favicon: {
    input: 'uploads/favicon.svg',
  },
  webawesome: {
    mode: 'free',
    assetBasePath: 'https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.1.0/dist-cdn',
  },
  componentEntrypoint: 'components/index.ts',
  additionalComponentEntrypoints: [],
}

function toScriptPath(entrypoint: string): string {
  if (entrypoint.endsWith('.ts')) {
    return `/${entrypoint.slice(0, -3)}.js`
  }
  if (entrypoint.endsWith('.js')) {
    return `/${entrypoint}`
  }
  return `/${entrypoint}.js`
}

/** Configure the site */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions)
  const basePathByMode: Record<'free' | 'pro', string> = {
    free: 'https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.1.0/dist-cdn',
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
    // .copy("lib", "lib")

    for (const entrypoint of options.additionalComponentEntrypoints ?? []) {
      site.add(entrypoint)
    }
  }
}
