import { createI18n } from 'vue-i18n'
import { messages } from '@/i18n/messages'

export const localeStorageKey = 'school-shuttle-bus.locale'
export const supportedLocales = ['zh-TW', 'en-US'] as const
export type AppLocale = (typeof supportedLocales)[number]

function normalizeLocale(locale?: string | null): AppLocale {
  if (!locale) {
    return 'zh-TW'
  }

  if (supportedLocales.includes(locale as AppLocale)) {
    return locale as AppLocale
  }

  if (locale.toLowerCase().startsWith('en')) {
    return 'en-US'
  }

  return 'zh-TW'
}

export function resolveInitialLocale() {
  if (typeof window === 'undefined') {
    return 'zh-TW' as AppLocale
  }

  const storedLocale =
    typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function'
      ? localStorage.getItem(localeStorageKey)
      : null

  return normalizeLocale(storedLocale || navigator.language)
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: 'zh-TW',
  messages,
})

export function applyLocale(locale: AppLocale) {
  i18n.global.locale.value = locale

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
    localStorage.setItem(localeStorageKey, locale)
  }
}
