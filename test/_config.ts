import lume from 'lume/mod.ts'
import theme from 'theme/mod.ts'

const site = lume()

site.use(theme({
  siteToc: {
    includeUrlPrefix: '/guides/',
    rootLabel: 'Start',
  },
  webawesome: {
    customPropertiesCssPath: '/styles/webawesome-theme.css',
  },
}))

export default site
