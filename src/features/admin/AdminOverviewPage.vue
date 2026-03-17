<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AdminLookupsResponse, NotificationDeliveryResponse, RouteResponse } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const lookups = ref<AdminLookupsResponse | null>(null)
const routes = ref<RouteResponse[]>([])
const history = ref<NotificationDeliveryResponse[]>([])
const errorMessage = ref('')

const activeRoutes = computed(() => routes.value.filter((route) => route.isActive))
const inactiveRoutes = computed(() => routes.value.filter((route) => !route.isActive))
const recentHistory = computed(() => history.value.slice(0, 5))
const managedStaffCount = computed(
  () => lookups.value?.staffProfiles.filter((staff) => staff.canManageAllRoutes).length ?? 0,
)

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
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">管理端首頁</div>
        <h2>{{ session.displayName }}，目前已載入 Demo 營運資料。</h2>
        <p class="muted">這裡用更有層次的摘要方式顯示學生、老師、路線與通知概況，方便快速確認系統可以進入 Demo。</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>學生總數</span>
          <strong>{{ lookups?.students.length ?? 0 }}</strong>
          <small>可供家長與學生角色登入展示</small>
        </div>
        <div class="metric-card">
          <span>老師總數</span>
          <strong>{{ lookups?.staffProfiles.length ?? 0 }}</strong>
          <small>{{ managedStaffCount }} 位可管理全部路線</small>
        </div>
        <div class="metric-card">
          <span>啟用中路線</span>
          <strong>{{ activeRoutes.length }}</strong>
          <small>另有 {{ inactiveRoutes.length }} 條停用中路線</small>
        </div>
        <div class="metric-card">
          <span>路線總數</span>
          <strong>{{ routes.length }}</strong>
          <small>可直接進入路線管理頁查看細節</small>
        </div>
        <div class="metric-card">
          <span>通知歷程</span>
          <strong>{{ history.length }}</strong>
          <small>含廣播、提醒等通知送達紀錄</small>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

    <div class="grid two">
      <section class="panel">
        <div class="section-header">
          <div>
            <h3>路線狀態速覽</h3>
            <p class="muted">可直接挑幾條路線講解不同方向、啟用狀態與指派老師。</p>
          </div>
        </div>

        <div class="route-list">
          <div v-for="route in routes.slice(0, 4)" :key="route.routeId" class="route-card">
            <div class="route-card-header">
              <div>
                <strong>{{ route.routeName }}</strong>
                <p class="muted">{{ route.campusName }} / {{ route.direction === 1 ? '去程' : '回程' }}</p>
              </div>
              <span class="status-badge" :class="route.isActive ? 'success' : 'neutral'">
                {{ route.isActive ? '啟用中' : '停用' }}
              </span>
            </div>

            <div class="tag-row">
              <span class="pill subtle">{{ route.stops.length }} 個站點</span>
              <span class="pill subtle">{{ route.assignments.length }} 位老師</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="section-header">
          <div>
            <h3>最近通知紀錄</h3>
            <p class="muted">用來展示後端通知機制與前端歷程列表已經串接完成。</p>
          </div>
        </div>

        <div v-if="!recentHistory.length" class="empty-state">
          <strong>目前尚無通知紀錄</strong>
          <span>可到營運作業頁送出廣播或執行提醒後，再回來查看。</span>
        </div>

        <div v-else class="list">
          <div v-for="item in recentHistory" :key="item.notificationDeliveryId" class="list-card">
            <div class="section-header">
              <div>
                <strong>{{ item.recipientEmail }}</strong>
                <p class="muted">{{ item.sentAtUtc || '尚未送出' }}</p>
              </div>
              <span class="status-badge" :class="item.errorMessage ? 'danger' : item.sentAtUtc ? 'success' : 'warning'">
                {{ item.status }}
              </span>
            </div>
            <p class="muted" style="margin: 0;">{{ item.errorMessage || '寄送成功，無錯誤訊息。' }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
