<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import QRCode from 'qrcode'
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
const showQrCode = ref(false)
const qrCodeDataUrl = ref('')
const qrCodeBusy = ref(false)
const qrCodeError = ref('')

const form = reactive({
  account: '',
  password: '',
})

const loginPageUrl = computed(() => {
  if (typeof window === 'undefined') {
    return 'https://wonderful-moss-0d3f8b800.1.azurestaticapps.net/login'
  }

  return new URL('/login', window.location.origin).toString()
})

function submit(account = form.account, password = form.password) {
  emit('authenticate', { account, password })
}

async function openQrCode() {
  showQrCode.value = true

  if (qrCodeDataUrl.value || qrCodeBusy.value) {
    return
  }

  qrCodeBusy.value = true
  qrCodeError.value = ''

  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(loginPageUrl.value, {
      width: 280,
      margin: 1,
      color: {
        dark: '#123b76',
        light: '#ffffff',
      },
    })
  } catch {
    qrCodeError.value = t('auth.qr.error')
  } finally {
    qrCodeBusy.value = false
  }
}

function closeQrCode() {
  showQrCode.value = false
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
          <div class="login-side-tools">
            <button class="button-ghost qr-trigger" type="button" @click="openQrCode">
              {{ t('auth.qr.trigger') }}
            </button>
            <LocaleSwitcher />
          </div>
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

    <div v-if="showQrCode" class="qr-overlay" @click.self="closeQrCode">
      <div class="qr-modal panel">
        <div class="section-header">
          <div>
            <h3>{{ t('auth.qr.title') }}</h3>
            <p class="muted">{{ t('auth.qr.description') }}</p>
          </div>
          <button class="button-ghost" type="button" @click="closeQrCode">{{ t('auth.qr.close') }}</button>
        </div>

        <div class="qr-card">
          <div v-if="qrCodeBusy" class="empty-state qr-placeholder">
            <strong>{{ t('auth.qr.loading') }}</strong>
          </div>
          <img v-else-if="qrCodeDataUrl" class="qr-image" :src="qrCodeDataUrl" :alt="t('auth.qr.title')" />
          <div v-else class="empty-state qr-placeholder">
            <strong>{{ qrCodeError || t('auth.qr.error') }}</strong>
          </div>

          <a class="button-secondary qr-link" :href="loginPageUrl" target="_blank" rel="noreferrer">
            {{ t('auth.qr.openLink') }}
          </a>
          <p class="qr-url">{{ loginPageUrl }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
