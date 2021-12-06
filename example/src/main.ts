import { createApp } from 'vue'
import App from './app'
import lazyPlugin from '../../src/index'
import loading from './a.png'
import error from './b.png'

import './reset.styl'

const app = createApp(App)
app.use(lazyPlugin, {
  loading,
  error
})
app.mount('#app')


