import plugins, { Options } from './plugins.ts'

import 'lume/types.ts'

export type { Options } from './plugins.ts'

export default function (options: Partial<Options> = {}) {
  return (site: Lume.Site) => {
    // Configure the site
    site.use(plugins(options))

    // Add only infrastructure files needed by theme consumers.
    // Do not import the theme's own docs pages/content into downstream sites.
    site.remote('/', import.meta.resolve('./src'), [
      '/_includes/**/*',
      '/components/**/*',
      '/style.css',
      '/uploads/**/*',
      '/lib/**/*',
      '/_data.yml',
    ])
  }
}
