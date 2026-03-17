<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AttendanceRecordResponse, AttendanceSessionResponse, RouteResponse, TripDirection } from '@/api/contracts'
import { attendanceStatusOptions, tripDirectionOptions } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const routes = ref<RouteResponse[]>([])
const sessions = ref<AttendanceSessionResponse[]>([])
const activeSession = ref<AttendanceSessionResponse | null>(null)
const routeId = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const direction = ref<TripDirection>(1)
const errorMessage = ref('')
const statusMessage = ref('')

async function load() {
  try {
    const [routePayload, sessionPayload] = await Promise.all([
      authorizedJson<RouteResponse[]>(session, '/api/routes'),
      authorizedJson<AttendanceSessionResponse[]>(session, '/api/attendance/sessions'),
    ])

    routes.value = routePayload
    sessions.value = sessionPayload
    routeId.value = routeId.value || routePayload[0]?.routeId || ''
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '載入點名資料失敗。'
  }
}

async function openSession() {
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    activeSession.value = await authorizedJson<AttendanceSessionResponse>(session, '/api/attendance/sessions', {
      method: 'POST',
      body: {
        routeId: routeId.value,
        date: date.value,
        direction: direction.value,
      },
    })

    await load()
    statusMessage.value = '點名 session 已建立。'
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '建立點名 session 失敗。'
  }
}

async function updateStatus(record: AttendanceRecordResponse, status: AttendanceRecordResponse['status']) {
  try {
    const payload = await authorizedJson<AttendanceRecordResponse>(
      session,
      `/api/attendance/records/${record.attendanceRecordId}`,
      {
        method: 'PATCH',
        body: { status },
      },
    )

    if (activeSession.value) {
      activeSession.value.records = activeSession.value.records.map((item) =>
        item.attendanceRecordId === record.attendanceRecordId ? payload : item,
      )
    }
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '更新點名狀態失敗。'
  }
}

async function completeSession() {
  if (!activeSession.value) {
    return
  }

  try {
    activeSession.value = await authorizedJson<AttendanceSessionResponse>(
      session,
      `/api/attendance/sessions/${activeSession.value.attendanceSessionId}/complete`,
      { method: 'POST' },
    )
    statusMessage.value = '點名作業已完成。'
    await load()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '完成點名失敗。'
  }
}

const visibleSessions = computed(() => sessions.value.slice().sort((left, right) => right.date.localeCompare(left.date)))

onMounted(load)
</script>

<template>
  <div class="grid two">
    <section class="panel">
      <div class="section-header">
        <h3>建立或開啟點名</h3>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>路線</label>
          <select v-model="routeId">
            <option v-for="route in routes" :key="route.routeId" :value="route.routeId">
              {{ route.routeName }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>日期</label>
          <input v-model="date" type="date" />
        </div>

        <div class="field">
          <label>方向</label>
          <select v-model="direction">
            <option v-for="item in tripDirectionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </div>
      </div>

      <div class="button-row" style="margin-top: 16px;">
        <button class="button" type="button" @click="openSession">建立點名</button>
      </div>

      <div v-if="statusMessage" class="alert success" style="margin-top: 14px;">{{ statusMessage }}</div>
      <div v-if="errorMessage" class="alert error" style="margin-top: 14px;">{{ errorMessage }}</div>

      <div class="list" style="margin-top: 18px;">
        <div v-for="item in visibleSessions" :key="item.attendanceSessionId" class="list-card">
          <div class="section-header">
            <div>
              <strong>{{ item.routeName }}</strong>
              <p class="muted">{{ item.date }} / {{ item.direction === 1 ? '去程' : '回程' }}</p>
            </div>
            <button class="button-ghost" type="button" @click="activeSession = item">查看</button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <h3>點名名單</h3>
        <button v-if="activeSession && !activeSession.isCompleted" class="button-secondary" type="button" @click="completeSession">
          完成點名
        </button>
      </div>

      <div v-if="!activeSession" class="alert info">請先從左側建立或選擇一個 session。</div>

      <div v-else class="list">
        <div v-for="record in activeSession.records" :key="record.attendanceRecordId" class="list-card">
          <div class="section-header">
            <div>
              <strong>{{ record.studentName }}</strong>
              <p class="muted">緊急聯絡電話：<a :href="`tel:${record.emergencyPhoneSnapshot || ''}`">{{ record.emergencyPhoneSnapshot || '未提供' }}</a></p>
            </div>
            <div class="status-actions">
              <button
                v-for="item in attendanceStatusOptions"
                :key="item.value"
                class="button-ghost"
                type="button"
                :disabled="activeSession.isCompleted"
                @click="updateStatus(record, item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
