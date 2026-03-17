<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminLookupsResponse, NotificationDeliveryResponse, ReminderRunResponse, ReportExportResponse, RouteResponse } from '@/api/contracts'
import {
  broadcastAudienceOptions,
  exportFormatOptions,
  formatNotificationStatus,
  reportTypeOptions,
  tripDirectionOptions,
} from '@/api/contracts'
import { authorizedDownload, authorizedJson, ApiError } from '@/api/http'
import { addDays, mondayOfWeek } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { t } = useI18n()
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
  subject: t('operations.broadcast.defaultSubject'),
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
const translatedTripDirectionOptions = computed(() =>
  tripDirectionOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)
const translatedBroadcastAudienceOptions = computed(() =>
  broadcastAudienceOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)
const translatedReportTypeOptions = computed(() =>
  reportTypeOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)
const translatedExportFormatOptions = computed(() =>
  exportFormatOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)

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
    errorMessage.value = error instanceof ApiError ? error.message : t('operations.messages.loadError')
  }
}

async function createDispatch() {
  try {
    await authorizedJson(session, '/api/admin/dispatches', {
      method: 'POST',
      body: dispatchForm.value,
    })
    statusMessage.value = t('operations.messages.dispatchSuccess')
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('operations.messages.dispatchError')
  }
}

async function sendBroadcast() {
  try {
    const result = await authorizedJson<{ deliveryCount: number }>(session, '/api/admin/broadcasts', {
      method: 'POST',
      body: broadcastForm.value,
    })
    statusMessage.value = t('operations.messages.broadcastSuccess', { count: result.deliveryCount })
    await load()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('operations.messages.broadcastError')
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
    statusMessage.value = t('operations.messages.exportSuccess', { fileName: report.fileName })
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('operations.messages.exportError')
  }
}

async function runReminders() {
  try {
    const result = await authorizedJson<ReminderRunResponse>(session, '/api/notifications/reminders/run', {
      method: 'POST',
    })
    statusMessage.value = t('operations.messages.reminderSuccess', { count: result.deliveryCount })
    await load()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('operations.messages.reminderError')
  }
}

onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">{{ t('operations.hero.pill') }}</div>
        <h2>{{ t('operations.hero.title') }}</h2>
        <p class="muted">{{ t('operations.hero.description') }}</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>{{ t('operations.metrics.students') }}</span>
          <strong>{{ lookups?.students.length ?? 0 }}</strong>
          <small>{{ t('operations.metrics.studentsHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('operations.metrics.routes') }}</span>
          <strong>{{ routes.length }}</strong>
          <small>{{ t('operations.metrics.routesHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('operations.metrics.sent') }}</span>
          <strong>{{ sentHistoryCount }}</strong>
          <small>{{ t('operations.metrics.sentHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('operations.metrics.failed') }}</span>
          <strong>{{ failedHistoryCount }}</strong>
          <small>{{ t('operations.metrics.failedHelp') }}</small>
        </div>
      </div>
    </section>

    <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>
    <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

    <div class="grid three">
      <section class="panel tool-card">
        <div class="section-header">
          <div>
            <h3>{{ t('operations.dispatch.title') }}</h3>
            <p class="muted">{{ t('operations.dispatch.description') }}</p>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label>{{ t('common.labels.student') }}</label>
            <select v-model="dispatchForm.studentId">
              <option v-for="student in lookups?.students || []" :key="student.studentId" :value="student.studentId">
                {{ student.studentNumber }} / {{ student.studentName }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>{{ t('common.labels.route') }}</label>
            <select v-model="dispatchForm.routeId">
              <option v-for="route in routes" :key="route.routeId" :value="route.routeId">{{ route.routeName }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t('common.labels.date') }}</label>
            <input v-model="dispatchForm.date" type="date" />
          </div>
          <div class="field">
            <label>{{ t('common.labels.direction') }}</label>
            <select v-model="dispatchForm.direction">
              <option v-for="item in translatedTripDirectionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
        </div>
        <div class="button-row" style="margin-top: 16px;">
          <button class="button" type="button" @click="createDispatch">{{ t('operations.dispatch.title') }}</button>
        </div>
      </section>

      <section class="panel tool-card">
        <div class="section-header">
          <div>
            <h3>{{ t('operations.broadcast.title') }}</h3>
            <p class="muted">{{ t('operations.broadcast.description') }}</p>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label>{{ t('common.labels.audience') }}</label>
            <select v-model="broadcastForm.audience">
              <option v-for="item in translatedBroadcastAudienceOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t('common.labels.subject') }}</label>
            <input v-model="broadcastForm.subject" />
          </div>
          <div class="field">
            <label>{{ t('common.labels.content') }}</label>
            <textarea v-model="broadcastForm.body" />
          </div>
        </div>
        <div class="button-row" style="margin-top: 16px;">
          <button class="button" type="button" @click="sendBroadcast">{{ t('common.actions.send') }}</button>
          <button class="button-secondary" type="button" @click="runReminders">{{ t('common.actions.run') }}</button>
        </div>
      </section>

      <section class="panel tool-card">
        <div class="section-header">
          <div>
            <h3>{{ t('operations.report.title') }}</h3>
            <p class="muted">{{ t('operations.report.description') }}</p>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label>{{ t('common.labels.reportType') }}</label>
            <select v-model="reportForm.reportType">
              <option v-for="item in translatedReportTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t('common.labels.format') }}</label>
            <select v-model="reportForm.exportFormat">
              <option v-for="item in translatedExportFormatOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t('common.labels.startDate') }}</label>
            <input v-model="reportForm.startDate" type="date" />
          </div>
          <div class="field">
            <label>{{ t('common.labels.endDate') }}</label>
            <input v-model="reportForm.endDate" type="date" />
          </div>
        </div>
        <div class="button-row" style="margin-top: 16px;">
          <button class="button" type="button" @click="exportReport">{{ t('common.actions.download') }}</button>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ t('operations.history.title') }}</h3>
          <p class="muted">{{ t('operations.history.description') }}</p>
        </div>
        <span class="pill subtle">{{ t('operations.history.count', { count: history.length }) }}</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('operations.history.recipient') }}</th>
              <th>{{ t('operations.history.status') }}</th>
              <th>{{ t('operations.history.sentAt') }}</th>
              <th>{{ t('operations.history.errorMessage') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history" :key="item.notificationDeliveryId">
              <td>{{ item.recipientEmail }}</td>
              <td>
                <span class="status-badge" :class="historyTone(item)">
                  {{ formatNotificationStatus(item.status, t) }}
                </span>
              </td>
              <td>{{ item.sentAtUtc || t('common.empty.notSent') }}</td>
              <td>{{ item.errorMessage || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
