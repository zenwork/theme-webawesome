import lightningcss from 'lume/plugins/lightningcss.ts'
import basePath from 'lume/plugins/base_path.ts'
import metas from 'lume/plugins/metas.ts'
import { Options as SitemapOptions, sitemap } from 'lume/plugins/sitemap.ts'
import { favicon, Options as FaviconOptions } from 'lume/plugins/favicon.ts'
import { merge } from 'lume/core/utils/object.ts'
import esbuild from 'lume/plugins/esbuild.ts'

import 'lume/types.ts'

export interface Options {
  sitemap?: Partial<SitemapOptions>
  favicon?: Partial<FaviconOptions>
}

export const defaults: Options = {
  favicon: {
    input: 'uploads/favicon.svg',
  },
}

/** Configure the site */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions)

  return (site: Lume.Site) => {
    site
      .use(lightningcss())
      .use(basePath())
      .use(metas())
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
      .add('uploads')
      .add('style.css')
      .add('components/index.ts')
      .copy("npm:@awesome.me/webawesome@^3.1.0/dist/styles/**/*.css", "styles/webawesome")
  }
}
