<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { buildNavigation } from '@/app/navigation'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()

const navigation = computed(() => buildNavigation(session.roles))

async function handleLogout() {
  await session.logout()
  await router.replace('/login')
}
</script>

<template>
  <div class="page-shell">
    <aside class="page-sidebar">
      <h1>康橋交通車 Demo</h1>
      <p>{{ session.displayName }}</p>
      <div class="pill">{{ session.roles.join(' / ') }}</div>

      <nav class="sidebar-nav">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="sidebar-link">
          <span>{{ item.label }}</span>
          <span>></span>
        </RouterLink>
      </nav>

      <div class="panel" style="margin-top: 28px; background: rgba(255,255,255,0.08); color: inherit;">
        <p class="muted">目前資料直接來自已部署的 Azure API。</p>
        <button class="button-ghost" type="button" @click="handleLogout">登出</button>
      </div>
    </aside>

    <main class="page-content">
      <div class="topbar">
        <div>
          <h2>School Shuttle Bus Frontend</h2>
          <p class="muted">前端單頁應用，直接串接 Azure Web API。</p>
        </div>
      </div>

      <slot />
    </main>
  </div>
</template>
