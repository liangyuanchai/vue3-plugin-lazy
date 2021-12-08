import { createApp } from 'vue'
import App from './App.vue'
import lazyPlugin from '../../src/index'
import loading from './assets/default.png'
import error from './assets/b.png'

import './assets/reset.styl'

const app = createApp(App)
app.use(lazyPlugin, {
  loading,
  error
})
app.mount('#app')