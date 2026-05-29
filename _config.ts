import lume from 'lume/mod.ts'
import theme from './mod.ts'

const site = lume({ src: './src' })

site.use(theme({
  siteToc: {
    root: '.',
  },
  webawesome: {},
}))

export default site
