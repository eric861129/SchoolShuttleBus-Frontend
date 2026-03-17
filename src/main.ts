import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter } from '@/app/router'
import { applyLocale, i18n } from '@/i18n'
import './style.css'

function shouldUseHandsetLayout() {
  if (typeof window === 'undefined') {
    return false
  }

  const supportsMatchMedia = typeof window.matchMedia === 'function'
  const coarsePointer = supportsMatchMedia ? window.matchMedia('(pointer: coarse)').matches : false
  const noHover = supportsMatchMedia ? window.matchMedia('(hover: none)').matches : false
  const screenMin = Math.min(window.screen.width || window.innerWidth, window.screen.height || window.innerHeight)
  const viewportMin = Math.min(window.innerWidth || screenMin, window.innerHeight || screenMin)

  return (coarsePointer || noHover) && Math.min(screenMin, viewportMin) <= 900
}

function syncResponsiveMode() {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('is-handset', shouldUseHandsetLayout())
}

if (typeof window !== 'undefined') {
  syncResponsiveMode()
  window.addEventListener('resize', syncResponsiveMode, { passive: true })
  window.addEventListener('orientationchange', syncResponsiveMode)
  window.visualViewport?.addEventListener('resize', syncResponsiveMode)
}

const app = createApp(App)
const pinia = createPinia()
const router = createAppRouter(pinia)

app.use(pinia)
app.use(router)
app.use(i18n)
applyLocale(i18n.global.locale.value)
app.mount('#app')
