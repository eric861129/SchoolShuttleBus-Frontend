import '@testing-library/jest-dom/vitest'
import { config } from '@vue/test-utils'
import { applyLocale, i18n } from '@/i18n'

config.global.plugins = [i18n]
applyLocale('zh-TW')
