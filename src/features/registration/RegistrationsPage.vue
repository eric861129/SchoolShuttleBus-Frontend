<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type {
  RegistrationDayResponse,
  RouteResponse,
  StudentRegistrationSummaryResponse,
  WeeklyRegistrationResponse,
} from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { formatDateLabel, nextWeekMonday } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const selectedStudentId = ref(session.context?.students[0]?.studentId || '')
const weekStart = ref(nextWeekMonday())
const summary = ref<StudentRegistrationSummaryResponse | null>(null)
const routes = ref<RouteResponse[]>([])
const editableWeek = ref<WeeklyRegistrationResponse | null>(null)
const formDays = ref<RegistrationDayResponse[]>([])
const statusMessage = ref('')
const errorMessage = ref('')
const busy = ref(false)

const morningRoutes = computed(() => routes.value.filter((route) => route.direction === 1 && route.isActive))
const homeRoutes = computed(() => routes.value.filter((route) => route.direction === 2 && route.isActive))
const selectedStudent = computed(() => session.context?.students.find((student) => student.studentId === selectedStudentId.value) || null)

async function load() {
  if (!selectedStudentId.value) {
    return
  }

  busy.value = true
  errorMessage.value = ''

  try {
    const [summaryPayload, routePayload, weekPayload] = await Promise.all([
      authorizedJson<StudentRegistrationSummaryResponse>(session, `/api/registrations/students/${selectedStudentId.value}/summary`),
      authorizedJson<RouteResponse[]>(session, '/api/routes'),
      authorizedJson<WeeklyRegistrationResponse>(
        session,
        `/api/registrations/weeks/${weekStart.value}?studentId=${selectedStudentId.value}`,
      ),
    ])

    summary.value = summaryPayload
    routes.value = routePayload
    editableWeek.value = weekPayload
    formDays.value = weekPayload.days.map((day) => ({ ...day }))
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '載入登記資料失敗。'
  } finally {
    busy.value = false
  }
}

async function saveWeek() {
  if (!selectedStudentId.value) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const payload = await authorizedJson<WeeklyRegistrationResponse>(session, `/api/registrations/weeks/${weekStart.value}`, {
      method: 'PUT',
      body: {
        studentId: selectedStudentId.value,
        weekStart: weekStart.value,
        days: formDays.value,
      },
    })

    editableWeek.value = payload
    formDays.value = payload.days.map((day) => ({ ...day }))
    statusMessage.value = '本週登記已儲存。'
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '儲存失敗。'
  } finally {
    busy.value = false
  }
}

async function copyLastWeek() {
  if (!selectedStudentId.value) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const payload = await authorizedJson<WeeklyRegistrationResponse>(
      session,
      `/api/registrations/weeks/${weekStart.value}/copy-last-week?studentId=${selectedStudentId.value}`,
      { method: 'POST' },
    )

    editableWeek.value = payload
    formDays.value = payload.days.map((day) => ({ ...day }))
    statusMessage.value = '已複製上一週設定。'
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '複製上一週失敗。'
  } finally {
    busy.value = false
  }
}

watch([selectedStudentId, weekStart], load)
onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel hero-panel">
      <div>
        <div class="pill">家長 / 學生</div>
        <h2 style="margin-top: 14px;">每週乘車登記與回程安排</h2>
        <p class="muted">直接編輯指定週次的上下學搭乘安排，前端會同步載入目前可選的路線與個人摘要。</p>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <span class="muted">目前學生</span>
          <strong>{{ selectedStudent?.studentName || '尚未選擇' }}</strong>
        </div>
        <div class="metric-card">
          <span class="muted">已登記趟次</span>
          <strong>{{ summary?.registeredTrips ?? 0 }}</strong>
        </div>
        <div class="metric-card">
          <span class="muted">已完成趟次</span>
          <strong>{{ summary?.presentTrips ?? 0 }}</strong>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="form-grid">
        <div class="field">
          <label>學生</label>
          <select v-model="selectedStudentId">
            <option v-for="student in session.context?.students || []" :key="student.studentId" :value="student.studentId">
              {{ student.studentName }} / {{ student.gradeLabel }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>登記週一日期</label>
          <input v-model="weekStart" type="date" />
        </div>
      </div>

      <div class="button-row" style="margin-top: 16px;">
        <button class="button-secondary" type="button" :disabled="busy" @click="copyLastWeek">複製上一週</button>
        <button class="button" type="button" :disabled="busy" @click="saveWeek">儲存本週登記</button>
      </div>

      <div v-if="statusMessage" class="alert success" style="margin-top: 14px;">{{ statusMessage }}</div>
      <div v-if="errorMessage" class="alert error" style="margin-top: 14px;">{{ errorMessage }}</div>
    </section>

    <section class="panel">
      <div class="section-header">
        <h3>每日搭乘設定</h3>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>去程搭乘</th>
              <th>去程路線</th>
              <th>回程搭乘</th>
              <th>回程路線</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in formDays" :key="day.date">
              <td>{{ formatDateLabel(day.date) }}</td>
              <td><input v-model="day.toSchool" type="checkbox" /></td>
              <td>
                <select v-model="day.toSchoolRouteId" :disabled="!day.toSchool">
                  <option :value="null">請選擇</option>
                  <option v-for="route in morningRoutes" :key="route.routeId" :value="route.routeId">
                    {{ route.routeName }}
                  </option>
                </select>
              </td>
              <td><input v-model="day.homebound" type="checkbox" /></td>
              <td>
                <select v-model="day.homeboundRouteId" :disabled="!day.homebound">
                  <option :value="null">請選擇</option>
                  <option v-for="route in homeRoutes" :key="route.routeId" :value="route.routeId">
                    {{ route.routeName }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
