<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { demoAccounts } from '@/features/auth/demoAccounts'
import LocaleSwitcher from '@/features/shared/LocaleSwitcher.vue'

defineProps<{
  busy?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  authenticate: [{ account: string; password: string }]
}>()
const { t } = useI18n()

const form = reactive({
  account: '',
  password: '',
})

function submit(account = form.account, password = form.password) {
  emit('authenticate', { account, password })
}
</script>

<template>
  <div class="login-screen">
    <div class="panel login-card">
      <section class="login-hero">
        <div class="eyebrow">{{ t('auth.hero.eyebrow') }}</div>
        <h1 class="hero-title">{{ t('auth.hero.title') }}</h1>
        <p class="hero-subtitle">{{ t('auth.hero.subtitle') }}</p>
        <div class="metric-grid" style="margin-top: 28px;">
          <div class="metric-card">
            <span>{{ t('common.roles.Parent') }} / {{ t('common.roles.Student') }}</span>
            <strong>{{ t('auth.metrics.familyTitle') }}</strong>
            <small>{{ t('auth.metrics.familyDescription') }}</small>
          </div>
          <div class="metric-card">
            <span>{{ t('common.roles.Teacher') }}</span>
            <strong>{{ t('auth.metrics.teacherTitle') }}</strong>
            <small>{{ t('auth.metrics.teacherDescription') }}</small>
          </div>
          <div class="metric-card">
            <span>{{ t('common.roles.Administrator') }}</span>
            <strong>{{ t('auth.metrics.adminTitle') }}</strong>
            <small>{{ t('auth.metrics.adminDescription') }}</small>
          </div>
        </div>
      </section>

      <section class="login-side">
        <div class="section-header">
          <div>
            <h2>{{ t('auth.form.title') }}</h2>
            <p class="muted">{{ t('auth.form.description') }}</p>
          </div>
          <LocaleSwitcher />
        </div>

        <div class="shortcut-grid">
          <button
            v-for="demo in demoAccounts"
            :key="demo.id"
            class="shortcut-card"
            type="button"
            :aria-label="t(`auth.accounts.${demo.id}.label`)"
            :disabled="busy"
            @click="submit(demo.account, demo.password)"
          >
            <strong>{{ t(`auth.accounts.${demo.id}.label`) }}</strong>
            <span>{{ t(`auth.accounts.${demo.id}.description`) }}</span>
          </button>
        </div>

        <div class="surface-note" style="margin-top: 18px;">
          {{ t('auth.form.hint') }}
          `P@ssw0rd!`。
        </div>

        <div class="field" style="margin-top: 18px;">
          <label for="account">{{ t('auth.form.accountLabel') }}</label>
          <input id="account" v-model="form.account" autocomplete="username" :placeholder="t('auth.form.accountPlaceholder')" />
          <small>{{ t('auth.form.accountHelp') }}</small>
        </div>

        <div class="field" style="margin-top: 14px;">
          <label for="password">{{ t('auth.form.passwordLabel') }}</label>
          <input id="password" v-model="form.password" type="password" autocomplete="current-password" :placeholder="t('auth.form.passwordPlaceholder')" />
        </div>

        <div v-if="errorMessage" class="alert error" style="margin-top: 14px;">
          {{ errorMessage }}
        </div>

        <div class="button-row" style="margin-top: 18px;">
          <button class="button" type="button" :disabled="busy" @click="submit()">
            {{ busy ? t('common.actions.loggingIn') : t('common.actions.login') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
