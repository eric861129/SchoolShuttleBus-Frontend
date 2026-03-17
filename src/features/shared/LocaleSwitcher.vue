<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyLocale, supportedLocales, type AppLocale } from '@/i18n'

const { locale, t } = useI18n()

const currentLocale = computed(() => locale.value as AppLocale)
const nextLocale = computed<AppLocale>(() =>
  currentLocale.value === supportedLocales[0] ? supportedLocales[1] : supportedLocales[0],
)
const toggleLabel = computed(() => t('locale.toggle', { locale: t(`locale.short.${nextLocale.value}`) }))

function toggleLocale() {
  applyLocale(nextLocale.value)
}
</script>

<template>
  <div class="locale-switcher">
    <button class="button-ghost locale-toggle" type="button" :aria-label="toggleLabel" @click="toggleLocale">
      {{ toggleLabel }}
    </button>
  </div>
</template>
