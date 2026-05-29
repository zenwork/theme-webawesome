import plugins, { Options } from './plugins.ts'
import { fromFileUrl } from 'jsr:@std/path@1.1.2'

import 'lume/types.ts'

export type { Options } from './plugins.ts'

export default function (options: Partial<Options> = {}) {
  return (site: Lume.Site) => {
    const themeSource = import.meta.resolve('./src')
    const themeWatchPaths = [
      './src/_includes',
      './src/components',
      './src/style.css',
      './src/uploads',
      './src/_data.yml',
    ]
    const themeWatchRemotes = [
      ['/_includes/', '/src/_includes/'],
      ['/components/', '/src/components/'],
      ['/uploads/', '/src/uploads/'],
      ['/style.css', '/src/style.css'],
      ['/_data.yml', '/src/_data.yml'],
    ] as const

    // Configure the site
    site.use(plugins(options))

    // Add only infrastructure files needed by theme consumers.
    // Do not import the theme's own docs pages/content into downstream sites.
    site.remote('/', themeSource, [
      '/_includes/**/*',
      '/components/**/*',
      '/style.css',
      '/uploads/**/*',
      '/_data.yml',
    ])

    if (themeSource.startsWith('file:')) {
      for (const path of themeWatchPaths) {
        const watchPath = fromFileUrl(new URL(path, import.meta.url))
        if (!site.options.watcher.include.includes(watchPath)) {
          site.options.watcher.include.push(watchPath)
        }
      }

      site.addEventListener('beforeUpdate', ({ files }) => {
        for (const file of [...files]) {
          for (const [remotePath, watchedPath] of themeWatchRemotes) {
            if (file === watchedPath) {
              files.add(remotePath)
              continue
            }

            if (watchedPath.endsWith('/') && file.startsWith(watchedPath)) {
              files.add(`${remotePath}${file.slice(watchedPath.length)}`)
            }
          }
        }
      })
    }
  }
}
