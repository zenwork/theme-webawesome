import lume from 'lume/mod.ts'
import plugins from './plugins.ts'
import theme from './mod.ts'

const site = lume({ src: './src' })

site.use(plugins())

site.use(theme({
  siteToc: {
    sectionsFromRoot: true,
    rootLabel: 'Overview',
  },
  webawesome: {
    customPropertiesCssPath: '/styles/webawesome-theme.css',
  },
               }))

export default site
