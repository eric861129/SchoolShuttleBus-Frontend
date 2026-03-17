<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { AdminLookupsResponse, RouteResponse } from '@/api/contracts'
import { routeTypeOptions, tripDirectionOptions } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const routes = ref<RouteResponse[]>([])
const lookups = ref<AdminLookupsResponse | null>(null)
const selectedRouteId = ref('')
const createForm = ref({
  routeName: '',
  routeType: 1 as RouteResponse['routeType'],
  direction: 1 as RouteResponse['direction'],
  campusName: 'Kang Chiao Linkou',
})
const editForm = ref({
  routeName: '',
  routeType: 1 as RouteResponse['routeType'],
  isActive: true,
})
const stops = ref<{ sequence: number; stopName: string; address: string; handoffContactName: string; handoffContactPhone: string }[]>([])
const assignStaffProfileId = ref('')
const errorMessage = ref('')
const statusMessage = ref('')

const selectedRoute = computed(() => routes.value.find((route) => route.routeId === selectedRouteId.value) || null)
const isAdministrator = computed(() => session.roles.includes('Administrator'))
const activeRouteCount = computed(() => routes.value.filter((route) => route.isActive).length)
const stopCount = computed(() => routes.value.reduce((sum, route) => sum + route.stops.length, 0))

function directionLabel(direction: RouteResponse['direction']) {
  return tripDirectionOptions.find((item) => item.value === direction)?.label || '未知方向'
}

function routeTypeLabel(routeType: RouteResponse['routeType']) {
  return routeTypeOptions.find((item) => item.value === routeType)?.label || '未知類型'
}

function syncSelectedRoute() {
  if (!selectedRoute.value) {
    return
  }

  editForm.value = {
    routeName: selectedRoute.value.routeName,
    routeType: selectedRoute.value.routeType,
    isActive: selectedRoute.value.isActive,
  }

  stops.value = selectedRoute.value.stops.map((stop) => ({
    sequence: stop.sequence,
    stopName: stop.stopName,
    address: stop.address,
    handoffContactName: stop.handoffContactName || '',
    handoffContactPhone: stop.handoffContactPhone || '',
  }))
}

async function load() {
  try {
    routes.value = await authorizedJson<RouteResponse[]>(session, '/api/routes')
    selectedRouteId.value = selectedRouteId.value || routes.value[0]?.routeId || ''

    if (isAdministrator.value) {
      lookups.value = await authorizedJson<AdminLookupsResponse>(session, '/api/admin/lookups')
    }

    syncSelectedRoute()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '載入路線資料失敗。'
  }
}

async function createRoute() {
  try {
    const route = await authorizedJson<RouteResponse>(session, '/api/routes', {
      method: 'POST',
      body: createForm.value,
    })

    statusMessage.value = `已建立路線：${route.routeName}`
    await load()
    selectedRouteId.value = route.routeId
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '建立路線失敗。'
  }
}

async function saveRoute() {
  if (!selectedRoute.value) {
    return
  }

  try {
    await authorizedJson<RouteResponse>(session, `/api/routes/${selectedRoute.value.routeId}`, {
      method: 'PATCH',
      body: editForm.value,
    })

    await authorizedJson<RouteResponse>(session, `/api/routes/${selectedRoute.value.routeId}/stops`, {
      method: 'POST',
      body: {
        stops: stops.value,
      },
    })

    if (assignStaffProfileId.value) {
      await authorizedJson<RouteResponse>(session, `/api/routes/assignments/${selectedRoute.value.routeId}`, {
        method: 'POST',
        body: { staffProfileId: assignStaffProfileId.value },
      })
    }

    statusMessage.value = '路線資料已更新。'
    await load()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '更新路線失敗。'
  }
}

function addStop() {
  stops.value.push({
    sequence: stops.value.length + 1,
    stopName: '',
    address: '',
    handoffContactName: '',
    handoffContactPhone: '',
  })
}

watch(selectedRouteId, syncSelectedRoute)
onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">{{ isAdministrator ? '路線總覽' : '我的路線' }}</div>
        <h2>{{ isAdministrator ? '用更清楚的方式維護路線與站點' : '快速查看並維護目前負責的路線' }}</h2>
        <p class="muted">把建立、選取、編輯與站點設定整理成同一個工作區，操作會更有節奏。</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>路線總數</span>
          <strong>{{ routes.length }}</strong>
          <small>目前可用於 Demo 的班車路線</small>
        </div>
        <div class="metric-card">
          <span>啟用中路線</span>
          <strong>{{ activeRouteCount }}</strong>
          <small>停用路線會保留資料但不供前台選用</small>
        </div>
        <div class="metric-card">
          <span>全部站點數</span>
          <strong>{{ stopCount }}</strong>
          <small>可展示每條路線的細部設定深度</small>
        </div>
        <div class="metric-card">
          <span>目前選取</span>
          <strong>{{ selectedRoute?.routeName || '尚未選擇' }}</strong>
          <small>{{ selectedRoute ? `${directionLabel(selectedRoute.direction)} / ${routeTypeLabel(selectedRoute.routeType)}` : '請先從左側選擇路線' }}</small>
        </div>
      </div>
    </section>

    <div class="grid two">
      <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ isAdministrator ? '建立新路線' : '我的路線' }}</h3>
          <p class="muted">{{ isAdministrator ? '先建立路線，再從下方列表切換編輯。' : '可查看自己可管理的路線與站點。' }}</p>
        </div>
      </div>

      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>

      <div v-if="isAdministrator" class="tool-card" style="margin-bottom: 18px;">
        <div class="form-grid">
          <div class="field">
            <label>路線名稱</label>
            <input v-model="createForm.routeName" />
          </div>
          <div class="field">
            <label>校區</label>
            <input v-model="createForm.campusName" />
          </div>
          <div class="field">
            <label>路線類型</label>
            <select v-model="createForm.routeType">
              <option v-for="item in routeTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>方向</label>
            <select v-model="createForm.direction">
              <option v-for="item in tripDirectionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
        </div>

        <div class="button-row">
          <button class="button" type="button" @click="createRoute">建立路線</button>
        </div>
      </div>

      <div class="route-list">
        <div
          v-for="route in routes"
          :key="route.routeId"
          class="route-card"
          :class="{ active: route.routeId === selectedRouteId }"
        >
          <div class="route-card-header">
            <div>
              <strong>{{ route.routeName }}</strong>
              <p class="muted">{{ directionLabel(route.direction) }} / {{ route.campusName }}</p>
            </div>
            <span class="status-badge" :class="route.isActive ? 'success' : 'neutral'">
              {{ route.isActive ? '啟用中' : '已停用' }}
            </span>
          </div>

          <div class="tag-row">
            <span class="pill subtle">{{ routeTypeLabel(route.routeType) }}</span>
            <span class="pill subtle">{{ route.stops.length }} 個站點</span>
            <span class="pill subtle">{{ route.assignments.length }} 位老師</span>
          </div>

          <div class="route-card-actions">
            <button class="button-ghost" type="button" @click="selectedRouteId = route.routeId">編輯</button>
          </div>
        </div>
      </div>
      </section>

      <section class="panel">
      <div class="section-header">
        <div>
          <h3>路線編輯</h3>
          <p class="muted">選取一條路線後，可立即調整屬性、站點與老師指派。</p>
        </div>
      </div>

      <div v-if="!selectedRoute" class="empty-state">
        <strong>尚未選擇任何路線</strong>
        <span>從左側列表點選一條路線，就能開始編輯細節。</span>
      </div>

      <div v-else class="stack">
        <div class="stats-grid">
          <div class="stat-card">
            <span>路線名稱</span>
            <strong>{{ selectedRoute.routeName }}</strong>
            <small>{{ selectedRoute.campusName }}</small>
          </div>
          <div class="stat-card">
            <span>方向 / 類型</span>
            <strong>{{ directionLabel(selectedRoute.direction) }}</strong>
            <small>{{ routeTypeLabel(selectedRoute.routeType) }}</small>
          </div>
          <div class="stat-card">
            <span>站點數</span>
            <strong>{{ stops.length }}</strong>
            <small>可用來展示完整路線規劃細節</small>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>路線名稱</label>
            <input v-model="editForm.routeName" />
          </div>
          <div class="field">
            <label>路線類型</label>
            <select v-model="editForm.routeType">
              <option v-for="item in routeTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>啟用狀態</label>
            <select v-model="editForm.isActive">
              <option :value="true">啟用</option>
              <option :value="false">停用</option>
            </select>
          </div>
          <div v-if="isAdministrator" class="field">
            <label>指派老師</label>
            <select v-model="assignStaffProfileId">
              <option value="">不變更</option>
              <option v-for="staff in lookups?.staffProfiles || []" :key="staff.staffProfileId" :value="staff.staffProfileId">
                {{ staff.employeeNumber }} / {{ staff.fullName }}
              </option>
            </select>
          </div>
        </div>

        <div class="section-header">
          <div>
            <h3>站點設定</h3>
            <p class="muted">可逐站調整順序、地址與交接資訊。</p>
          </div>
          <button class="button-secondary" type="button" @click="addStop">新增站點</button>
        </div>

        <div class="list">
          <div v-for="stop in stops" :key="stop.sequence" class="stop-card">
            <div class="form-grid">
              <div class="field">
                <label>順序</label>
                <input v-model.number="stop.sequence" type="number" min="1" />
              </div>
              <div class="field">
                <label>站點名稱</label>
                <input v-model="stop.stopName" />
              </div>
              <div class="field">
                <label>地址</label>
                <input v-model="stop.address" />
              </div>
              <div class="field">
                <label>交接聯絡人</label>
                <input v-model="stop.handoffContactName" />
              </div>
              <div class="field">
                <label>交接電話</label>
                <input v-model="stop.handoffContactPhone" />
              </div>
            </div>
          </div>
        </div>

        <div class="button-row">
          <button v-if="isAdministrator" class="button" type="button" @click="saveRoute">儲存路線設定</button>
        </div>
      </div>
      </section>
    </div>
  </div>
</template>
