<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AttendanceRecordResponse, AttendanceSessionResponse, RouteResponse, TripDirection } from '@/api/contracts'
import { attendanceStatusOptions, tripDirectionOptions } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { filterRoutesByDirection, resolveAttendanceRouteId } from '@/features/attendance/attendanceForm'
import AppModal from '@/features/shared/AppModal.vue'
import { formatDateLabelForLocale, todayInTimeZone } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { t, locale } = useI18n()
const routes = ref<RouteResponse[]>([])
const sessions = ref<AttendanceSessionResponse[]>([])
const activeSession = ref<AttendanceSessionResponse | null>(null)
const routeId = ref('')
const date = ref(todayInTimeZone())
const direction = ref<TripDirection>(1)
const errorMessage = ref('')
const statusMessage = ref('')
const isRosterModalOpen = ref(false)
const isCompactRoster = ref(false)
let rosterMediaQuery: MediaQueryList | null = null
let removeRosterResizeListener: (() => void) | null = null
const translatedTripDirectionOptions = computed(() =>
  tripDirectionOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)
const translatedAttendanceStatusOptions = computed(() =>
  attendanceStatusOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)
const usesRosterModal = computed(() => isCompactRoster.value)
const showInlineRoster = computed(() => !!activeSession.value && !usesRosterModal.value)
const activeSessionId = computed(() => activeSession.value?.attendanceSessionId || '')
const availableRoutes = computed(() => filterRoutesByDirection(routes.value, direction.value))

function summarizeSession(sessionItem: AttendanceSessionResponse | null | undefined) {
  const records = sessionItem?.records || []

  return {
    total: records.length,
    boarded: records.filter((record) => record.status === 2).length,
    onLeave: records.filter((record) => record.status === 3).length,
    absent: records.filter((record) => record.status === 4).length,
  }
}

function syncRouteSelection(preferredRouteId = routeId.value) {
  routeId.value = resolveAttendanceRouteId(routes.value, direction.value, preferredRouteId)
}

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
  const matched = translatedAttendanceStatusOptions.value.find((item) => item.value === status)
  return matched?.label || t('common.fallback.unknownStatus')
}

function formatSessionDateLabel(value: string) {
  return formatDateLabelForLocale(value, locale.value)
}

const activeSessionSummary = computed(() => summarizeSession(activeSession.value))

function applyRosterLayout(matchesCompact: boolean) {
  const wasCompact = isCompactRoster.value
  isCompactRoster.value = matchesCompact

  if (!matchesCompact && wasCompact && isRosterModalOpen.value) {
    isRosterModalOpen.value = false
  }
}

function syncRosterLayout() {
  if (typeof window === 'undefined') {
    applyRosterLayout(false)
    return
  }

  const matchesCompact = typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 1100px)').matches
    : window.innerWidth <= 1100

  applyRosterLayout(matchesCompact)
}

function handleRosterMediaQueryChange(event: MediaQueryListEvent) {
  applyRosterLayout(event.matches)
}

async function load() {
  try {
    const [routePayload, sessionPayload] = await Promise.all([
      authorizedJson<RouteResponse[]>(session, '/api/routes'),
      authorizedJson<AttendanceSessionResponse[]>(session, '/api/attendance/sessions'),
    ])

    routes.value = routePayload
    sessions.value = sessionPayload
    syncRouteSelection(routeId.value)
    activeSession.value = activeSession.value
      ? sessionPayload.find((item) => item.attendanceSessionId === activeSession.value?.attendanceSessionId) || activeSession.value
      : null
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('attendance.messages.loadError')
  }
}

async function openSession() {
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const nextSession = await authorizedJson<AttendanceSessionResponse>(session, '/api/attendance/sessions', {
      method: 'POST',
      body: {
        routeId: routeId.value,
        date: date.value,
        direction: direction.value,
      },
    })

    activeSession.value = nextSession
    await load()
    openRosterExperience(
      sessions.value.find((item) => item.attendanceSessionId === nextSession.attendanceSessionId) || nextSession,
    )
    statusMessage.value = t('attendance.messages.openSuccess')
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('attendance.messages.openError')
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
    errorMessage.value = error instanceof ApiError ? error.message : t('attendance.messages.updateError')
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
    statusMessage.value = t('attendance.messages.completeSuccess')
    await load()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('attendance.messages.completeError')
  }
}

function selectSession(sessionItem: AttendanceSessionResponse) {
  activeSession.value = sessionItem
}

function openRosterExperience(sessionItem: AttendanceSessionResponse) {
  activeSession.value = sessionItem

  if (usesRosterModal.value) {
    isRosterModalOpen.value = true
  }
}

const visibleSessions = computed(() => sessions.value.slice().sort((left, right) => right.date.localeCompare(left.date)))

watch(direction, () => {
  syncRouteSelection()
})

watch(routes, (nextRoutes) => {
  routeId.value = resolveAttendanceRouteId(nextRoutes, direction.value, routeId.value)
})

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    rosterMediaQuery = window.matchMedia('(max-width: 1100px)')
    applyRosterLayout(rosterMediaQuery.matches)

    rosterMediaQuery.addEventListener?.('change', handleRosterMediaQueryChange)
    rosterMediaQuery.addListener?.(handleRosterMediaQueryChange)
  } else {
    syncRosterLayout()
    window.addEventListener('resize', syncRosterLayout, { passive: true })
    removeRosterResizeListener = () => window.removeEventListener('resize', syncRosterLayout)
  }

  load()
})

onBeforeUnmount(() => {
  rosterMediaQuery?.removeEventListener?.('change', handleRosterMediaQueryChange)
  rosterMediaQuery?.removeListener?.(handleRosterMediaQueryChange)
  removeRosterResizeListener?.()
})
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">{{ t('attendance.hero.pill') }}</div>
        <h2>{{ t('attendance.hero.title') }}</h2>
        <p class="muted">{{ t('attendance.hero.description') }}</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>{{ t('attendance.metrics.availableRoutes') }}</span>
          <strong>{{ availableRoutes.length }}</strong>
          <small>{{ t('attendance.metrics.availableRoutesHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('attendance.metrics.sessions') }}</span>
          <strong>{{ visibleSessions.length }}</strong>
          <small>{{ t('attendance.metrics.sessionsHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('attendance.metrics.roster') }}</span>
          <strong>{{ activeSessionSummary.total }}</strong>
          <small>{{ t('attendance.metrics.rosterHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('attendance.metrics.boarded') }}</span>
          <strong>{{ activeSessionSummary.boarded }}</strong>
          <small>{{ t('attendance.metrics.boardedHelp') }}</small>
        </div>
      </div>
    </section>

    <div class="grid two">
      <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ t('attendance.create.title') }}</h3>
          <p class="muted">{{ t('attendance.create.description') }}</p>
        </div>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>{{ t('common.labels.route') }}</label>
          <select v-model="routeId">
            <option v-for="route in availableRoutes" :key="route.routeId" :value="route.routeId">
              {{ route.routeName }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>{{ t('common.labels.date') }}</label>
          <input v-model="date" type="date" />
        </div>

        <div class="field">
            <label>{{ t('common.labels.direction') }}</label>
            <select v-model="direction">
            <option v-for="item in translatedTripDirectionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
      </div>

      <p v-if="!availableRoutes.length" class="muted" style="margin-top: 14px;">
        {{ t('attendance.create.noRoutesForDirection') }}
      </p>

      <div class="button-row" style="margin-top: 16px;">
        <button class="button" type="button" :disabled="!routeId" @click="openSession">{{ t('attendance.create.button') }}</button>
      </div>

      <div v-if="statusMessage" class="alert success" style="margin-top: 14px;">{{ statusMessage }}</div>
      <div v-if="errorMessage" class="alert error" style="margin-top: 14px;">{{ errorMessage }}</div>

      <div class="list" style="margin-top: 18px;">
        <div
          v-for="item in visibleSessions"
          :key="item.attendanceSessionId"
          class="list-card is-interactive"
          :class="{ active: item.attendanceSessionId === activeSessionId }"
          role="button"
          tabindex="0"
          @click="selectSession(item)"
          @keydown.enter.prevent="selectSession(item)"
          @keydown.space.prevent="selectSession(item)"
        >
          <div class="section-header">
            <div>
              <strong>{{ item.routeName }}</strong>
              <p class="muted">{{ formatSessionDateLabel(item.date) }} / {{ item.direction === 1 ? t('common.tripDirection.toSchool') : t('common.tripDirection.homebound') }}</p>
              <p class="muted">{{ t('attendance.roster.totalLabel') }} {{ summarizeSession(item).total }}</p>
            </div>
            <span class="status-badge" :class="item.isCompleted ? 'success' : 'info'">
              {{ item.isCompleted ? t('common.sessionState.completed') : t('common.sessionState.inProgress') }}
            </span>
          </div>
          <div v-if="usesRosterModal" class="route-card-actions">
            <button class="button-ghost" type="button" @click.stop="openRosterExperience(item)">{{ t('common.actions.view') }}</button>
          </div>
        </div>
      </div>
      </section>

      <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ t('attendance.roster.title') }}</h3>
          <p class="muted">{{ t('attendance.roster.description') }}</p>
        </div>
        <button v-if="activeSession && !activeSession.isCompleted && !showInlineRoster" class="button-secondary" type="button" @click="completeSession">
          {{ t('common.actions.complete') }}
        </button>
      </div>

      <div v-if="!activeSession" class="empty-state">
        <strong>{{ t('attendance.roster.emptyTitle') }}</strong>
        <span>{{ t('attendance.roster.emptyDescription') }}</span>
      </div>

      <div v-else-if="showInlineRoster" class="stack">
        <div class="section-header">
          <div>
            <strong>{{ activeSession.routeName }}</strong>
            <p class="muted">
              {{ formatSessionDateLabel(activeSession.date) }} /
              {{ activeSession.direction === 1 ? t('common.tripDirection.toSchool') : t('common.tripDirection.homebound') }}
            </p>
          </div>
          <button v-if="!activeSession.isCompleted" class="button-secondary" type="button" @click="completeSession">
            {{ t('common.actions.complete') }}
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span>{{ t('attendance.roster.totalLabel') }}</span>
            <strong>{{ activeSessionSummary.total }}</strong>
            <small>{{ t('attendance.roster.totalHelp') }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('attendance.roster.boardedLabel') }}</span>
            <strong>{{ activeSessionSummary.boarded }}</strong>
            <small>{{ t('attendance.roster.boardedHelp') }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('attendance.roster.leaveAbsentLabel') }}</span>
            <strong>{{ activeSessionSummary.onLeave + activeSessionSummary.absent }}</strong>
            <small>{{ t('attendance.roster.leaveAbsentHelp') }}</small>
          </div>
        </div>

        <div class="stat-card">
          <span>{{ t('attendance.roster.dateLabel') }}</span>
          <strong>{{ formatSessionDateLabel(activeSession.date) }}</strong>
          <small>{{ activeSession.direction === 1 ? t('common.tripDirection.toSchool') : t('common.tripDirection.homebound') }} / {{ activeSession.routeName }}</small>
        </div>

        <div v-if="!activeSession.records.length" class="empty-state">
          <strong>{{ t('attendance.roster.zeroTitle') }}</strong>
          <span>{{ t('attendance.roster.zeroDescription') }}</span>
        </div>

        <div v-else class="list">
          <div v-for="record in activeSession.records" :key="record.attendanceRecordId" class="record-card">
            <div class="record-card-header">
              <div>
                <strong>{{ record.studentName }}</strong>
                <p class="muted">
                  <span>{{ t('attendance.roster.emergencyPhoneLabel') }}</span>
                  <a v-if="record.emergencyPhoneSnapshot" :href="`tel:${record.emergencyPhoneSnapshot}`">
                    {{ record.emergencyPhoneSnapshot }}
                  </a>
                  <span v-else>{{ t('common.empty.notProvided') }}</span>
                </p>
              </div>
              <span class="status-badge" :class="statusTone(record.status)">
                {{ statusLabel(record.status) }}
              </span>
            </div>

            <div class="record-card-actions">
              <div>
                <button
                  v-for="item in translatedAttendanceStatusOptions"
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

      <div v-else class="stack">
        <div class="stats-grid">
          <div class="stat-card">
            <span>{{ t('attendance.roster.totalLabel') }}</span>
            <strong>{{ activeSessionSummary.total }}</strong>
            <small>{{ t('attendance.roster.totalHelp') }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('attendance.roster.boardedLabel') }}</span>
            <strong>{{ activeSessionSummary.boarded }}</strong>
            <small>{{ t('attendance.roster.boardedHelp') }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('attendance.roster.leaveAbsentLabel') }}</span>
            <strong>{{ activeSessionSummary.onLeave + activeSessionSummary.absent }}</strong>
            <small>{{ t('attendance.roster.leaveAbsentHelp') }}</small>
          </div>
        </div>

        <div class="empty-state">
          <strong>{{ activeSession.routeName }}</strong>
          <span>{{ formatSessionDateLabel(activeSession.date) }} / {{ activeSession.direction === 1 ? t('common.tripDirection.toSchool') : t('common.tripDirection.homebound') }}</span>
          <span>{{ t('attendance.roster.totalStatus', { count: activeSessionSummary.total }) }}</span>
        </div>

        <div class="button-row">
          <button class="button" type="button" @click="openRosterExperience(activeSession)">{{ t('common.actions.view') }}</button>
        </div>
      </div>
      </section>
    </div>

    <AppModal
      v-if="usesRosterModal"
      v-model="isRosterModalOpen"
      :title="t('attendance.roster.title')"
      :description="t('attendance.roster.description')"
      width="wide"
      :close-label="t('common.actions.close')"
    >
      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>

      <div v-if="activeSession" class="stack">
        <div class="section-header">
          <div>
            <strong>{{ activeSession.routeName }}</strong>
            <p class="muted">{{ formatSessionDateLabel(activeSession.date) }} / {{ activeSession.direction === 1 ? t('common.tripDirection.toSchool') : t('common.tripDirection.homebound') }}</p>
          </div>
          <button v-if="!activeSession.isCompleted" class="button-secondary" type="button" @click="completeSession">
            {{ t('common.actions.complete') }}
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span>{{ t('attendance.roster.totalLabel') }}</span>
            <strong>{{ activeSessionSummary.total }}</strong>
            <small>{{ t('attendance.roster.totalHelp') }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('attendance.roster.boardedLabel') }}</span>
            <strong>{{ activeSessionSummary.boarded }}</strong>
            <small>{{ t('attendance.roster.boardedHelp') }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('attendance.roster.leaveAbsentLabel') }}</span>
            <strong>{{ activeSessionSummary.onLeave + activeSessionSummary.absent }}</strong>
            <small>{{ t('attendance.roster.leaveAbsentHelp') }}</small>
          </div>
        </div>

        <div class="stat-card">
          <span>{{ t('attendance.roster.dateLabel') }}</span>
          <strong>{{ formatSessionDateLabel(activeSession.date) }}</strong>
          <small>{{ activeSession.direction === 1 ? t('common.tripDirection.toSchool') : t('common.tripDirection.homebound') }} / {{ activeSession.routeName }}</small>
        </div>

        <div v-if="!activeSession.records.length" class="empty-state">
          <strong>{{ t('attendance.roster.zeroTitle') }}</strong>
          <span>{{ t('attendance.roster.zeroDescription') }}</span>
        </div>

        <div v-else class="list">
          <div v-for="record in activeSession.records" :key="record.attendanceRecordId" class="record-card">
            <div class="record-card-header">
              <div>
                <strong>{{ record.studentName }}</strong>
                <p class="muted">
                  <span>{{ t('attendance.roster.emergencyPhoneLabel') }}</span>
                  <a v-if="record.emergencyPhoneSnapshot" :href="`tel:${record.emergencyPhoneSnapshot}`">
                    {{ record.emergencyPhoneSnapshot }}
                  </a>
                  <span v-else>{{ t('common.empty.notProvided') }}</span>
                </p>
              </div>
              <span class="status-badge" :class="statusTone(record.status)">
                {{ statusLabel(record.status) }}
              </span>
            </div>

            <div class="record-card-actions">
              <div>
                <button
                  v-for="item in translatedAttendanceStatusOptions"
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
    </AppModal>
  </div>
</template>
