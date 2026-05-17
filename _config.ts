import lume from 'lume/mod.ts'
import theme from './mod.ts'

const site = lume({ src: './src' })

site.use(theme({
  siteToc: {
    sectionsFromRoot: false,
    rootLabel: 'Overview',
  },
  webawesome: {
    customPropertiesCssPath: '/styles/webawesome-theme.css',
  },
}))

export default site
