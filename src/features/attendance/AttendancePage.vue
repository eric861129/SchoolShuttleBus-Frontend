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

function statusTone(status: AttendanceRecordResponse['status']) {
  switch (status) {
    case 2:
      return 'success'
    case 3:
      return 'warning'
    case 4:
      return 'danger'
    default:
      return 'info'
  }
}

function statusLabel(status: AttendanceRecordResponse['status']) {
  return attendanceStatusOptions.find((item) => item.value === status)?.label || '未知狀態'
}

const activeSessionSummary = computed(() => {
  const records = activeSession.value?.records || []

  return {
    total: records.length,
    boarded: records.filter((record) => record.status === 2).length,
    onLeave: records.filter((record) => record.status === 3).length,
    absent: records.filter((record) => record.status === 4).length,
  }
})

async function load() {
  try {
    const [routePayload, sessionPayload] = await Promise.all([
      authorizedJson<RouteResponse[]>(session, '/api/routes'),
      authorizedJson<AttendanceSessionResponse[]>(session, '/api/attendance/sessions'),
    ])

    routes.value = routePayload
    sessions.value = sessionPayload
    routeId.value = routeId.value || routePayload[0]?.routeId || ''
    activeSession.value = activeSession.value
      ? sessionPayload.find((item) => item.attendanceSessionId === activeSession.value?.attendanceSessionId) || activeSession.value
      : null
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
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">老師 / 管理端</div>
        <h2>建立點名並即時更新學生狀態</h2>
        <p class="muted">把路線、日期與方向先定好，再從同一畫面完成查看、點名與結案。</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>可用路線</span>
          <strong>{{ routes.length }}</strong>
          <small>目前可建立點名的班車路線數</small>
        </div>
        <div class="metric-card">
          <span>歷史 Session</span>
          <strong>{{ visibleSessions.length }}</strong>
          <small>包含已完成與進行中的點名紀錄</small>
        </div>
        <div class="metric-card">
          <span>目前名單</span>
          <strong>{{ activeSessionSummary.total }}</strong>
          <small>已開啟 Session 時會顯示學生總數</small>
        </div>
        <div class="metric-card">
          <span>已上車</span>
          <strong>{{ activeSessionSummary.boarded }}</strong>
          <small>可直接在右側名單快速更新</small>
        </div>
      </div>
    </section>

    <div class="grid two">
      <section class="panel">
      <div class="section-header">
        <div>
          <h3>建立或開啟點名</h3>
          <p class="muted">先建立新 Session，或從下方列表選擇既有點名紀錄。</p>
        </div>
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
        <button class="button" type="button" :disabled="!routeId" @click="openSession">建立點名</button>
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
            <span class="status-badge" :class="item.isCompleted ? 'success' : 'info'">
              {{ item.isCompleted ? '已完成' : '進行中' }}
            </span>
          </div>
          <div class="route-card-actions">
            <button class="button-ghost" type="button" @click="activeSession = item">查看</button>
          </div>
        </div>
      </div>
      </section>

      <section class="panel">
      <div class="section-header">
        <div>
          <h3>點名名單</h3>
          <p class="muted">逐一更新學生搭乘狀態，完成後即可結案。</p>
        </div>
        <button v-if="activeSession && !activeSession.isCompleted" class="button-secondary" type="button" @click="completeSession">
          完成點名
        </button>
      </div>

      <div v-if="!activeSession" class="empty-state">
        <strong>尚未開啟點名 Session</strong>
        <span>先從左側建立新的點名，或點選既有 Session 查看名單。</span>
      </div>

      <div v-else class="stack">
        <div class="stats-grid">
          <div class="stat-card">
            <span>點名日期</span>
            <strong>{{ activeSession.date }}</strong>
            <small>{{ activeSession.direction === 1 ? '去程' : '回程' }} / {{ activeSession.routeName }}</small>
          </div>
          <div class="stat-card">
            <span>已上車</span>
            <strong>{{ activeSessionSummary.boarded }}</strong>
            <small>目前已確認上車的學生數</small>
          </div>
          <div class="stat-card">
            <span>請假 / 缺席</span>
            <strong>{{ activeSessionSummary.onLeave + activeSessionSummary.absent }}</strong>
            <small>需留意的學生狀態總和</small>
          </div>
        </div>

        <div class="list">
          <div v-for="record in activeSession.records" :key="record.attendanceRecordId" class="record-card">
            <div class="record-card-header">
              <div>
                <strong>{{ record.studentName }}</strong>
                <p class="muted">緊急聯絡電話：<a :href="`tel:${record.emergencyPhoneSnapshot || ''}`">{{ record.emergencyPhoneSnapshot || '未提供' }}</a></p>
              </div>
              <span class="status-badge" :class="statusTone(record.status)">
                {{ statusLabel(record.status) }}
              </span>
            </div>

            <div class="record-card-actions">
              <div>
                <button
                  v-for="item in attendanceStatusOptions"
                  :key="item.value"
                  class="status-button"
                  :class="{ 'is-active': record.status === item.value, [statusTone(item.value)]: true }"
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
      </div>
      </section>
    </div>
  </div>
</template>
