<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section class="panel">
    <div class="section-header">
      <h2>{{ t('shared.notFound.title') }}</h2>
    </div>
    <p class="muted">{{ t('shared.notFound.description') }}</p>
  </section>
</template>
