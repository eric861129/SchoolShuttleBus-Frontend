<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyLocale, supportedLocales, type AppLocale } from '@/i18n'

const { locale, t } = useI18n()

const selectedLocale = computed({
  get: () => locale.value as AppLocale,
  set: (value: AppLocale) => applyLocale(value),
})

const localeOptions = computed(() =>
  supportedLocales.map((value) => ({
    value,
    label: t(`locale.${value}`),
  })),
)
</script>

<template>
  <div class="locale-switcher">
    <label for="locale-switcher">{{ t('locale.label') }}</label>
    <select id="locale-switcher" v-model="selectedLocale">
      <option v-for="item in localeOptions" :key="item.value" :value="item.value">
        {{ item.label }}
      </option>
    </select>
  </div>
</template>
