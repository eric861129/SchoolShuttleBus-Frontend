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
const selectedWeekLabel = computed(() => editableWeek.value?.weekStart || weekStart.value)
const configuredDays = computed(() => formDays.value.filter((day) => day.toSchool || day.homebound).length)
const weeklyTrips = computed(() =>
  formDays.value.reduce((sum, day) => sum + Number(day.toSchool) + Number(day.homebound), 0),
)

function getRouteName(routeId: string | null) {
  return routes.value.find((route) => route.routeId === routeId)?.routeName || '尚未選擇'
}

function daySummaryTone(day: RegistrationDayResponse) {
  if (day.toSchool && day.homebound) {
    return 'success'
  }

  if (day.toSchool || day.homebound) {
    return 'warning'
  }

  return 'neutral'
}

function daySummaryText(day: RegistrationDayResponse) {
  if (day.toSchool && day.homebound) {
    return '去回程皆已安排'
  }

  if (day.toSchool || day.homebound) {
    return '部分安排'
  }

  return '尚未搭乘'
}

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
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">家長 / 學生</div>
        <h2>每週乘車登記與回程安排</h2>
        <p class="muted">直接編輯指定週次的上下學搭乘安排，系統會同步載入可選路線與個人搭乘摘要。</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>目前學生</span>
          <strong>{{ selectedStudent?.studentName || '尚未選擇' }}</strong>
          <small>{{ selectedStudent?.gradeLabel || '請先選擇學生' }}</small>
        </div>
        <div class="metric-card">
          <span>已登記趟次</span>
          <strong>{{ summary?.registeredTrips ?? 0 }}</strong>
          <small>歷史已儲存的搭乘次數</small>
        </div>
        <div class="metric-card">
          <span>本週已排天數</span>
          <strong>{{ configuredDays }}</strong>
          <small>本次編輯中至少有一趟搭乘的日期</small>
        </div>
        <div class="metric-card">
          <span>本週預計趟次</span>
          <strong>{{ weeklyTrips }}</strong>
          <small>依目前表單計算的上下學總趟次</small>
        </div>
        <div class="metric-card">
          <span>已完成趟次</span>
          <strong>{{ summary?.presentTrips ?? 0 }}</strong>
          <small>累積完成的實際搭乘次數</small>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="dashboard-split">
        <div class="stack">
          <div class="section-header">
            <div>
              <h3>設定本週登記</h3>
              <p class="muted">先選擇學生與週次，再快速套用或儲存本週安排。</p>
            </div>
            <span class="pill subtle">週一 {{ selectedWeekLabel }}</span>
          </div>

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
              <small>建議選擇週一，方便整週行程一起管理。</small>
            </div>
          </div>

          <div class="button-row">
            <button class="button-secondary" type="button" :disabled="busy" @click="copyLastWeek">複製上一週</button>
            <button class="button" type="button" :disabled="busy" @click="saveWeek">儲存本週登記</button>
          </div>

          <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>
          <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
        </div>

        <div class="surface-note">
          <strong>Demo 操作建議</strong>
          <p style="margin: 10px 0 0;">
            先選學生後按「複製上一週」，再調整其中一兩天的去程或回程路線，最後按「儲存本週登記」，會最容易看出系統價值。
          </p>
          <p style="margin: 10px 0 0;">
            去程只會顯示去程路線，回程只會顯示回程路線；取消勾選時，該段路線會自動清空，避免誤送資料。
          </p>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h3>每日搭乘設定</h3>
          <p class="muted">每一天都能獨立設定去程與回程，適合處理才藝班、安親班或臨時調整。</p>
        </div>
        <span class="pill subtle">{{ formDays.length }} 天</span>
      </div>

      <div class="day-grid">
        <article v-for="day in formDays" :key="day.date" class="day-card">
          <div class="day-card-header">
            <div>
              <strong>{{ formatDateLabel(day.date) }}</strong>
              <p class="muted">{{ day.date }}</p>
            </div>
            <span class="status-badge" :class="daySummaryTone(day)">
              {{ daySummaryText(day) }}
            </span>
          </div>

          <div class="day-options">
            <div class="toggle-card" :class="{ active: day.toSchool }">
              <label class="checkbox-pill">
                <input
                  v-model="day.toSchool"
                  type="checkbox"
                  @change="!day.toSchool && (day.toSchoolRouteId = null)"
                />
                <span>去程搭乘</span>
              </label>
              <select v-model="day.toSchoolRouteId" :disabled="!day.toSchool">
                <option :value="null">請選擇去程路線</option>
                <option v-for="route in morningRoutes" :key="route.routeId" :value="route.routeId">
                  {{ route.routeName }}
                </option>
              </select>
              <span class="helper-text">目前安排：{{ day.toSchool ? getRouteName(day.toSchoolRouteId) : '本日不搭乘去程' }}</span>
            </div>

            <div class="toggle-card" :class="{ active: day.homebound }">
              <label class="checkbox-pill">
                <input
                  v-model="day.homebound"
                  type="checkbox"
                  @change="!day.homebound && (day.homeboundRouteId = null)"
                />
                <span>回程搭乘</span>
              </label>
              <select v-model="day.homeboundRouteId" :disabled="!day.homebound">
                <option :value="null">請選擇回程路線</option>
                <option v-for="route in homeRoutes" :key="route.routeId" :value="route.routeId">
                  {{ route.routeName }}
                </option>
              </select>
              <span class="helper-text">目前安排：{{ day.homebound ? getRouteName(day.homeboundRouteId) : '本日不搭乘回程' }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
