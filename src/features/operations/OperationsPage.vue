<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AdminLookupsResponse, NotificationDeliveryResponse, ReminderRunResponse, ReportExportResponse, RouteResponse } from '@/api/contracts'
import {
  broadcastAudienceOptions,
  exportFormatOptions,
  reportTypeOptions,
  tripDirectionOptions,
} from '@/api/contracts'
import { authorizedDownload, authorizedJson, ApiError } from '@/api/http'
import { addDays, mondayOfWeek } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const lookups = ref<AdminLookupsResponse | null>(null)
const routes = ref<RouteResponse[]>([])
const history = ref<NotificationDeliveryResponse[]>([])
const statusMessage = ref('')
const errorMessage = ref('')

const dispatchForm = ref({
  studentId: '',
  routeId: '',
  date: new Date().toISOString().slice(0, 10),
  direction: 1 as 1 | 2,
})

const broadcastForm = ref({
  audience: 1 as 1 | 2 | 3 | 4,
  subject: 'School Shuttle Bus Demo 通知',
  body: '',
})

const reportForm = ref({
  reportType: 1 as 1 | 2 | 3,
  exportFormat: 1 as 1,
  startDate: mondayOfWeek(),
  endDate: addDays(mondayOfWeek(), 4),
})

const sentHistoryCount = computed(() => history.value.filter((item) => item.sentAtUtc).length)
const failedHistoryCount = computed(() => history.value.filter((item) => item.errorMessage).length)

function historyTone(item: NotificationDeliveryResponse) {
  if (item.errorMessage) {
    return 'danger'
  }

  if (item.sentAtUtc) {
    return 'success'
  }

  return 'warning'
}

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
    dispatchForm.value.studentId = dispatchForm.value.studentId || lookupPayload.students[0]?.studentId || ''
    dispatchForm.value.routeId = dispatchForm.value.routeId || routePayload[0]?.routeId || ''
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '載入營運作業資料失敗。'
  }
}

async function createDispatch() {
  try {
    await authorizedJson(session, '/api/admin/dispatches', {
      method: 'POST',
      body: dispatchForm.value,
    })
    statusMessage.value = '已建立調度記錄。'
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '建立調度失敗。'
  }
}

async function sendBroadcast() {
  try {
    const result = await authorizedJson<{ deliveryCount: number }>(session, '/api/admin/broadcasts', {
      method: 'POST',
      body: broadcastForm.value,
    })
    statusMessage.value = `廣播已送出，共 ${result.deliveryCount} 筆。`
    await load()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '發送廣播失敗。'
  }
}

async function exportReport() {
  try {
    const report = await authorizedJson<ReportExportResponse>(session, '/api/admin/reports', {
      method: 'POST',
      body: reportForm.value,
    })
    const file = await authorizedDownload(session, `/api/admin/reports/${report.reportExportId}`)
    const url = URL.createObjectURL(file.blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.click()
    URL.revokeObjectURL(url)
    statusMessage.value = `報表 ${report.fileName} 已下載。`
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '匯出報表失敗。'
  }
}

async function runReminders() {
  try {
    const result = await authorizedJson<ReminderRunResponse>(session, '/api/notifications/reminders/run', {
      method: 'POST',
    })
    statusMessage.value = `提醒工作已執行，共送出 ${result.deliveryCount} 筆通知。`
    await load()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '執行提醒失敗。'
  }
}

onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">營運作業中心</div>
        <h2>把調度、通知與報表集中在同一個工作台</h2>
        <p class="muted">每個功能都用更明確的卡片與說明包起來，Demo 時比較容易講清楚整體營運流程。</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>學生名單</span>
          <strong>{{ lookups?.students.length ?? 0 }}</strong>
          <small>可建立調度的學生總數</small>
        </div>
        <div class="metric-card">
          <span>可用路線</span>
          <strong>{{ routes.length }}</strong>
          <small>目前已同步到前端的班車路線</small>
        </div>
        <div class="metric-card">
          <span>通知已送出</span>
          <strong>{{ sentHistoryCount }}</strong>
          <small>歷史上已完成寄送的通知數</small>
        </div>
        <div class="metric-card">
          <span>通知異常</span>
          <strong>{{ failedHistoryCount }}</strong>
          <small>可快速示範錯誤處理與追蹤</small>
        </div>
      </div>
    </section>

    <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>
    <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

    <div class="grid three">
      <section class="panel tool-card">
        <div class="section-header">
          <div>
            <h3>建立調度</h3>
            <p class="muted">處理臨時換車、補位或特殊行程安排。</p>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label>學生</label>
            <select v-model="dispatchForm.studentId">
              <option v-for="student in lookups?.students || []" :key="student.studentId" :value="student.studentId">
                {{ student.studentNumber }} / {{ student.studentName }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>路線</label>
            <select v-model="dispatchForm.routeId">
              <option v-for="route in routes" :key="route.routeId" :value="route.routeId">{{ route.routeName }}</option>
            </select>
          </div>
          <div class="field">
            <label>日期</label>
            <input v-model="dispatchForm.date" type="date" />
          </div>
          <div class="field">
            <label>方向</label>
            <select v-model="dispatchForm.direction">
              <option v-for="item in tripDirectionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
        </div>
        <div class="button-row" style="margin-top: 16px;">
          <button class="button" type="button" @click="createDispatch">建立調度</button>
        </div>
      </section>

      <section class="panel tool-card">
        <div class="section-header">
          <div>
            <h3>廣播通知</h3>
            <p class="muted">適合臨時停駛、到站提醒或校方公告。</p>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label>對象</label>
            <select v-model="broadcastForm.audience">
              <option v-for="item in broadcastAudienceOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>主旨</label>
            <input v-model="broadcastForm.subject" />
          </div>
          <div class="field">
            <label>內容</label>
            <textarea v-model="broadcastForm.body" />
          </div>
        </div>
        <div class="button-row" style="margin-top: 16px;">
          <button class="button" type="button" @click="sendBroadcast">送出廣播</button>
          <button class="button-secondary" type="button" @click="runReminders">執行提醒</button>
        </div>
      </section>

      <section class="panel tool-card">
        <div class="section-header">
          <div>
            <h3>報表匯出</h3>
            <p class="muted">Demo 時可直接下載 CSV，快速展示資料可追蹤性。</p>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label>報表類型</label>
            <select v-model="reportForm.reportType">
              <option v-for="item in reportTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>格式</label>
            <select v-model="reportForm.exportFormat">
              <option v-for="item in exportFormatOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>開始日期</label>
            <input v-model="reportForm.startDate" type="date" />
          </div>
          <div class="field">
            <label>結束日期</label>
            <input v-model="reportForm.endDate" type="date" />
          </div>
        </div>
        <div class="button-row" style="margin-top: 16px;">
          <button class="button" type="button" @click="exportReport">下載報表</button>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="section-header">
        <div>
          <h3>通知歷程</h3>
          <p class="muted">最近寄送結果與錯誤訊息一覽，方便在營運頁補充說明。</p>
        </div>
        <span class="pill subtle">{{ history.length }} 筆</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>收件人</th>
              <th>狀態</th>
              <th>送出時間</th>
              <th>錯誤訊息</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history" :key="item.notificationDeliveryId">
              <td>{{ item.recipientEmail }}</td>
              <td>
                <span class="status-badge" :class="historyTone(item)">
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.sentAtUtc || '尚未送出' }}</td>
              <td>{{ item.errorMessage || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
