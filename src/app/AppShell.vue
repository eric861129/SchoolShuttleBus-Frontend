<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { buildNavigation } from '@/app/navigation'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()

const navigation = computed(() => buildNavigation(session.roles))

const pageMetaMap = {
  '/admin': {
    eyebrow: 'Admin Command',
    title: '管理總覽',
    description: '用更清楚的營運摘要，快速展示 Demo 資料與系統健康度。',
  },
  '/attendance': {
    eyebrow: 'Teacher Flow',
    title: '老師點名',
    description: '從建立點名到更新學生狀態，集中在同一個操作節奏內完成。',
  },
  '/routes': {
    eyebrow: 'Route Studio',
    title: '路線管理',
    description: '以更直觀的方式查看路線、站點與教師指派資訊。',
  },
  '/operations': {
    eyebrow: 'Operations Hub',
    title: '營運作業',
    description: '把調度、廣播與報表匯出整理成適合 Demo 的作業入口。',
  },
  '/registrations': {
    eyebrow: 'Family Portal',
    title: '乘車登記',
    description: '讓家長或學生能快速完成一整週的上下學乘車安排。',
  },
  '/schedule': {
    eyebrow: 'Weekly Preview',
    title: '本週預覽',
    description: '以清楚的時間軸檢視目前與下週預填的搭乘安排。',
  },
} as const

const pageMeta = computed(() => pageMetaMap[route.path as keyof typeof pageMetaMap] || {
  eyebrow: 'School Shuttle Bus',
  title: '康橋交通車 Demo',
  description: '前端單頁應用，直接串接 Azure Web API。',
})

const roleSummary = computed(() => session.roles.join(' / ') || '訪客')
const initials = computed(() => session.displayName.slice(0, 1))
const todayLabel = computed(() =>
  new Intl.DateTimeFormat('zh-TW', {
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
        <div class="eyebrow">Kang Chiao Demo</div>
        <h1>康橋交通車登記系統</h1>
        <p>明天 DEMO 可直接展示的交通車入口，串接 Azure Static Web Apps、App Service 與 Azure SQL。</p>
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
            <strong>{{ item.label }}</strong>
            <p>{{ item.description }}</p>
          </div>
          <span class="sidebar-arrow">→</span>
        </RouterLink>
      </nav>

      <div class="sidebar-note">
        <p>目前資料直接來自已部署的 Azure API，可用來現場展示跨角色流程。</p>
        <button class="button-ghost" type="button" @click="handleLogout">登出</button>
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
          <div class="mini-stat">
            <span>目前身份</span>
            <strong>{{ roleSummary }}</strong>
          </div>
          <div class="mini-stat">
            <span>使用者</span>
            <strong>{{ session.displayName }}</strong>
          </div>
        </div>
      </div>

      <slot />
    </main>
  </div>
</template>
