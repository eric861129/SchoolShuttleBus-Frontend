import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter } from '@/app/router'
import { applyLocale, i18n } from '@/i18n'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
const router = createAppRouter(pinia)

app.use(pinia)
app.use(router)
app.use(i18n)
applyLocale(i18n.global.locale.value)
app.mount('#app')
