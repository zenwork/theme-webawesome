import lume from 'lume/mod.ts'
import theme from 'theme/mod.ts'

const site = lume()

site.copy('logos')

site.use(theme({
  siteLogo: {
    src: '/logos/test-site-logo.svg',
    alt: 'Theme test site logo',
  },
  siteToc: {
    root: '.',
    sections: [
      { folder: 'docs', label: 'Platform', order: 0 },
      { folder: 'guides', label: 'Guides', order: 1 },
      { folder: 'reference', label: 'Reference', order: 2 },
      { folder: 'platform', label: 'Foo', order: 3 },
    ],
  },
  webawesome: {
    customPropertiesCssPath: '/styles/webawesome-theme.css',
    // customPropertiesCssPath: '/styles/webawesome-theme-blue.css',
  },
}))

export default site
