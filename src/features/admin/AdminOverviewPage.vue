<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { AdminLookupsResponse, NotificationDeliveryResponse, RouteResponse } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const lookups = ref<AdminLookupsResponse | null>(null)
const routes = ref<RouteResponse[]>([])
const history = ref<NotificationDeliveryResponse[]>([])
const errorMessage = ref('')

async function load() {
  try {
    const [lookupPayload, routePayload, historyPayload] = await Promise.all([
      authorizedJson<AdminLookupsResponse>(session, '/api/admin/lookups'),
      authorizedJson<RouteResponse[]>(session, '/api/routes'),
      authorizedJson<NotificationDeliveryResponse[]>(session, '/api/notifications/history'),
    ])

    lookups.value = lookupPayload
    routes.value = routePayload
    history.value = historyPayload
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '管理總覽載入失敗。'
  }
}

onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel hero-panel">
      <div>
        <div class="pill">管理端首頁</div>
        <h2 style="margin-top: 14px;">{{ session.displayName }}，目前已載入 demo 營運資料。</h2>
        <p class="muted">這裡顯示學生、老師、路線與通知數量，方便快速確認後端 seed 與前端串接是否正常。</p>
      </div>
      <div class="metric-grid">
        <div class="metric-card">
          <span class="muted">學生總數</span>
          <strong>{{ lookups?.students.length ?? 0 }}</strong>
        </div>
        <div class="metric-card">
          <span class="muted">老師總數</span>
          <strong>{{ lookups?.staffProfiles.length ?? 0 }}</strong>
        </div>
        <div class="metric-card">
          <span class="muted">路線總數</span>
          <strong>{{ routes.length }}</strong>
        </div>
        <div class="metric-card">
          <span class="muted">通知歷程</span>
          <strong>{{ history.length }}</strong>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
  </div>
</template>
