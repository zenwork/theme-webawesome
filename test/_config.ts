import lume from 'lume/mod.ts'
import theme from 'theme/mod.ts'

const site = lume()

site.use(theme({
  siteToc: {
    sectionsFromRoot: true,
    rootLabel: ['Platform', 'Reference', 'Foo', 'Guides'],
    sectionOrder: ['docs','guides', 'reference','platform', ],
  },
  webawesome: {
    customPropertiesCssPath: '/styles/webawesome-theme.css',
  },
}))

export default site
