<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { formatUserRole } from '@/api/contracts'
import { buildNavigation } from '@/app/navigation'
import LocaleSwitcher from '@/features/shared/LocaleSwitcher.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

const navigation = computed(() => buildNavigation(session.roles))

const pageMetaMap = {
  '/admin': 'shell.pages.admin',
  '/attendance': 'shell.pages.attendance',
  '/routes': 'shell.pages.routes',
  '/operations': 'shell.pages.operations',
  '/registrations': 'shell.pages.registrations',
  '/schedule': 'shell.pages.schedule',
} as const

const pageMeta = computed(() => {
  const key = pageMetaMap[route.path as keyof typeof pageMetaMap]

  return {
    eyebrow: t(key ? `${key}.eyebrow` : 'shell.fallback.eyebrow'),
    title: t(key ? `${key}.title` : 'shell.fallback.title'),
    description: t(key ? `${key}.description` : 'shell.fallback.description'),
  }
})

const roleSummary = computed(() =>
  session.roles.map((role) => formatUserRole(role, t)).join(' / ') || t('common.roles.visitor'),
)
const initials = computed(() => session.displayName.slice(0, 1))
const todayLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date()),
)

async function handleLogout() {
  await session.logout()
  await router.replace('/login')
}
</script>

<template>
  <div class="page-shell">
    <aside class="page-sidebar">
      <section class="sidebar-brand">
        <div class="eyebrow">{{ t('shell.brandEyebrow') }}</div>
        <h1>{{ t('shell.brandTitle') }}</h1>
        <p>{{ t('shell.brandDescription') }}</p>
      </section>

      <section class="sidebar-user-card">
        <div class="sidebar-avatar">{{ initials }}</div>
        <div>
          <strong>{{ session.displayName }}</strong>
          <p>{{ todayLabel }}</p>
        </div>
      </section>

      <div class="sidebar-pills">
        <span class="pill light">{{ roleSummary }}</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="sidebar-link">
          <div>
            <strong>{{ t(item.labelKey) }}</strong>
            <p>{{ t(item.descriptionKey) }}</p>
          </div>
          <span class="sidebar-arrow">→</span>
        </RouterLink>
      </nav>

      <div class="sidebar-note">
        <p>{{ t('shell.dataSource') }}</p>
        <button class="button-ghost" type="button" @click="handleLogout">{{ t('common.actions.logout') }}</button>
      </div>
    </aside>

    <main class="page-content">
      <div class="topbar">
        <div>
          <div class="eyebrow">{{ pageMeta.eyebrow }}</div>
          <h2>{{ pageMeta.title }}</h2>
          <p class="muted">{{ pageMeta.description }}</p>
        </div>

        <div class="topbar-meta">
          <LocaleSwitcher />
          <div class="mini-stat">
            <span>{{ t('common.labels.currentRole') }}</span>
            <strong>{{ roleSummary }}</strong>
          </div>
          <div class="mini-stat">
            <span>{{ t('common.labels.user') }}</span>
            <strong>{{ session.displayName }}</strong>
          </div>
        </div>
      </div>

      <slot />
    </main>
  </div>
</template>
