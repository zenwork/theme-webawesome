import lume from 'lume/mod.ts'
import theme from 'theme/mod.ts'

const site = lume()

site.use(theme({
  siteToc: {
    sectionsFromRoot: true,
    rootLabel: 'Start',
    sectionOrder: ['platform', 'reference', 'docs', 'guides'],
  },
  webawesome: {
    customPropertiesCssPath: '/styles/webawesome-theme.css',
  },
}))

export default site
