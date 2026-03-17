<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  RegistrationDayResponse,
  RouteResponse,
  StudentRegistrationSummaryResponse,
  WeeklyRegistrationResponse,
} from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { formatDateLabelForLocale, nextWeekMonday } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { locale, t } = useI18n()
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
  return routes.value.find((route) => route.routeId === routeId)?.routeName || t('registrations.summary.noRouteSelected')
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
    return t('registrations.summary.allSet')
  }

  if (day.toSchool || day.homebound) {
    return t('registrations.summary.partial')
  }

  return t('registrations.summary.none')
}

function formatDateLabel(date: string) {
  return formatDateLabelForLocale(date, locale.value)
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
    errorMessage.value = error instanceof ApiError ? error.message : t('registrations.messages.loadError')
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
    statusMessage.value = t('registrations.messages.saveSuccess')
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('registrations.messages.saveError')
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
    statusMessage.value = t('registrations.messages.copySuccess')
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('registrations.messages.copyError')
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
        <div class="pill">{{ t('registrations.hero.pill') }}</div>
        <h2>{{ t('registrations.hero.title') }}</h2>
        <p class="muted">{{ t('registrations.hero.description') }}</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>{{ t('registrations.metrics.currentStudent') }}</span>
          <strong>{{ selectedStudent?.studentName || t('common.empty.notSelected') }}</strong>
          <small>{{ selectedStudent?.gradeLabel || t('registrations.metrics.currentStudentHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('registrations.metrics.registeredTrips') }}</span>
          <strong>{{ summary?.registeredTrips ?? 0 }}</strong>
          <small>{{ t('registrations.metrics.registeredTripsHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('registrations.metrics.configuredDays') }}</span>
          <strong>{{ configuredDays }}</strong>
          <small>{{ t('registrations.metrics.configuredDaysHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('registrations.metrics.weeklyTrips') }}</span>
          <strong>{{ weeklyTrips }}</strong>
          <small>{{ t('registrations.metrics.weeklyTripsHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('registrations.metrics.presentTrips') }}</span>
          <strong>{{ summary?.presentTrips ?? 0 }}</strong>
          <small>{{ t('registrations.metrics.presentTripsHelp') }}</small>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="dashboard-split">
        <div class="stack">
          <div class="section-header">
            <div>
              <h3>{{ t('registrations.editor.title') }}</h3>
              <p class="muted">{{ t('registrations.editor.description') }}</p>
            </div>
            <span class="pill subtle">{{ t('registrations.editor.mondayPrefix') }} {{ selectedWeekLabel }}</span>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>{{ t('common.labels.student') }}</label>
              <select v-model="selectedStudentId">
                <option v-for="student in session.context?.students || []" :key="student.studentId" :value="student.studentId">
                  {{ student.studentName }} / {{ student.gradeLabel }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>{{ t('common.labels.weekStart') }}</label>
              <input v-model="weekStart" type="date" />
              <small>{{ t('registrations.editor.weekStartHelp') }}</small>
            </div>
          </div>

          <div class="button-row">
            <button class="button-secondary" type="button" :disabled="busy" @click="copyLastWeek">{{ t('common.actions.copyLastWeek') }}</button>
            <button class="button" type="button" :disabled="busy" @click="saveWeek">{{ t('common.actions.save') }}</button>
          </div>

          <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>
          <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
        </div>

        <div class="surface-note">
          <strong>{{ t('registrations.hint.title') }}</strong>
          <p style="margin: 10px 0 0;">
            {{ t('registrations.hint.step1') }}
          </p>
          <p style="margin: 10px 0 0;">
            {{ t('registrations.hint.step2') }}
          </p>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ t('registrations.daySettings.title') }}</h3>
          <p class="muted">{{ t('registrations.daySettings.description') }}</p>
        </div>
        <span class="pill subtle">{{ formDays.length }} {{ t('registrations.daySettings.dayUnit') }}</span>
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
                <span>{{ t('registrations.daySettings.toSchool') }}</span>
              </label>
              <select v-model="day.toSchoolRouteId" :disabled="!day.toSchool">
                <option :value="null">{{ t('registrations.daySettings.selectToSchoolRoute') }}</option>
                <option v-for="route in morningRoutes" :key="route.routeId" :value="route.routeId">
                  {{ route.routeName }}
                </option>
              </select>
              <span class="helper-text">
                {{ t('registrations.daySettings.currentPlan', { plan: day.toSchool ? getRouteName(day.toSchoolRouteId) : t('registrations.daySettings.noToSchoolToday') }) }}
              </span>
            </div>

            <div class="toggle-card" :class="{ active: day.homebound }">
              <label class="checkbox-pill">
                <input
                  v-model="day.homebound"
                  type="checkbox"
                  @change="!day.homebound && (day.homeboundRouteId = null)"
                />
                <span>{{ t('registrations.daySettings.homebound') }}</span>
              </label>
              <select v-model="day.homeboundRouteId" :disabled="!day.homebound">
                <option :value="null">{{ t('registrations.daySettings.selectHomeboundRoute') }}</option>
                <option v-for="route in homeRoutes" :key="route.routeId" :value="route.routeId">
                  {{ route.routeName }}
                </option>
              </select>
              <span class="helper-text">
                {{ t('registrations.daySettings.currentPlan', { plan: day.homebound ? getRouteName(day.homeboundRouteId) : t('registrations.daySettings.noHomeboundToday') }) }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
