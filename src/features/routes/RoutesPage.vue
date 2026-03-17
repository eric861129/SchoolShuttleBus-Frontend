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
  <div class="grid two">
    <section class="panel">
      <div class="section-header">
        <h3>{{ isAdministrator ? '建立新路線' : '我的路線' }}</h3>
      </div>

      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>

      <div v-if="isAdministrator" class="grid">
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

      <div class="list" style="margin-top: 18px;">
        <div v-for="route in routes" :key="route.routeId" class="list-card">
          <div class="section-header">
            <div>
              <strong>{{ route.routeName }}</strong>
              <p class="muted">{{ route.direction === 1 ? '去程' : '回程' }} / {{ route.campusName }}</p>
            </div>
            <button class="button-ghost" type="button" @click="selectedRouteId = route.routeId">編輯</button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <h3>路線編輯</h3>
      </div>

      <div v-if="!selectedRoute" class="alert info">尚未選擇任何路線。</div>
      <div v-else class="grid">
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
          <h3>站點設定</h3>
          <button class="button-secondary" type="button" @click="addStop">新增站點</button>
        </div>

        <div class="list">
          <div v-for="stop in stops" :key="stop.sequence" class="list-card">
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
</template>
