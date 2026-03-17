<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WeeklyRegistrationResponse } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { formatDateLabelForLocale, mondayOfWeek, nextWeekMonday } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { locale, t } = useI18n()
const studentId = session.context?.students[0]?.studentId || ''
const currentWeek = ref<WeeklyRegistrationResponse | null>(null)
const nextWeek = ref<WeeklyRegistrationResponse | null>(null)
const errorMessage = ref('')

function tripCount(week: WeeklyRegistrationResponse | null) {
  return week?.days.reduce((sum, day) => sum + Number(day.toSchool) + Number(day.homebound), 0) ?? 0
}

function activeDaysCount(week: WeeklyRegistrationResponse | null) {
  return week?.days.filter((day) => day.toSchool || day.homebound).length ?? 0
}

function summaryTone(toSchool: boolean, homebound: boolean) {
  if (toSchool && homebound) {
    return 'success'
  }

  if (toSchool || homebound) {
    return 'warning'
  }

  return 'neutral'
}

function formatDateLabel(date: string) {
  return formatDateLabelForLocale(date, locale.value)
}

const currentWeekTrips = computed(() => tripCount(currentWeek.value))
const nextWeekTrips = computed(() => tripCount(nextWeek.value))
const currentWeekDays = computed(() => activeDaysCount(currentWeek.value))
const nextWeekDays = computed(() => activeDaysCount(nextWeek.value))

async function load() {
  if (!studentId) {
    return
  }

  try {
    const [currentPayload, nextPayload] = await Promise.all([
      authorizedJson<WeeklyRegistrationResponse>(session, `/api/registrations/weeks/${mondayOfWeek()}?studentId=${studentId}`),
      authorizedJson<WeeklyRegistrationResponse>(session, `/api/registrations/weeks/${nextWeekMonday()}?studentId=${studentId}`),
    ])

    currentWeek.value = currentPayload
    nextWeek.value = nextPayload
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('schedule.messages.loadError')
  }
}

onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">{{ t('schedule.hero.pill') }}</div>
        <h2>{{ t('schedule.hero.title') }}</h2>
        <p class="muted">{{ t('schedule.hero.description') }}</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>{{ t('schedule.metrics.currentWeekDays') }}</span>
          <strong>{{ currentWeekDays }}</strong>
          <small>{{ t('schedule.metrics.currentWeekDaysHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('schedule.metrics.currentWeekTrips') }}</span>
          <strong>{{ currentWeekTrips }}</strong>
          <small>{{ t('schedule.metrics.currentWeekTripsHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('schedule.metrics.nextWeekDays') }}</span>
          <strong>{{ nextWeekDays }}</strong>
          <small>{{ t('schedule.metrics.nextWeekDaysHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('schedule.metrics.nextWeekTrips') }}</span>
          <strong>{{ nextWeekTrips }}</strong>
          <small>{{ t('schedule.metrics.nextWeekTripsHelp') }}</small>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

    <div class="grid two">
      <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ t('schedule.sections.currentWeekTitle') }}</h3>
          <p class="muted">{{ t('schedule.sections.currentWeekDescription') }}</p>
        </div>
        <span class="pill subtle">{{ currentWeek?.weekStart || mondayOfWeek() }}</span>
      </div>

      <div v-if="!(currentWeek?.days.length)" class="empty-state">
        <strong>{{ t('schedule.empty.currentWeekTitle') }}</strong>
        <span>{{ t('schedule.empty.currentWeekDescription') }}</span>
      </div>

      <div v-else class="timeline">
        <div v-for="day in currentWeek?.days || []" :key="day.date" class="timeline-card">
          <div class="timeline-card-header">
            <strong>{{ formatDateLabel(day.date) }}</strong>
            <span class="status-badge" :class="summaryTone(day.toSchool, day.homebound)">
              {{ day.toSchool || day.homebound ? t('schedule.status.arranged') : t('schedule.status.none') }}
            </span>
          </div>
          <p class="muted">{{ t('schedule.status.toSchool', { value: day.toSchool ? t('schedule.status.riding') : t('schedule.status.notRiding') }) }}</p>
          <p class="muted">{{ t('schedule.status.homebound', { value: day.homebound ? t('schedule.status.riding') : t('schedule.status.notRiding') }) }}</p>
        </div>
      </div>
      </section>

      <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ t('schedule.sections.nextWeekTitle') }}</h3>
          <p class="muted">{{ t('schedule.sections.nextWeekDescription') }}</p>
        </div>
        <span class="pill subtle">{{ nextWeek?.weekStart || nextWeekMonday() }}</span>
      </div>

      <div v-if="!(nextWeek?.days.length)" class="empty-state">
        <strong>{{ t('schedule.empty.nextWeekTitle') }}</strong>
        <span>{{ t('schedule.empty.nextWeekDescription') }}</span>
      </div>

      <div v-else class="timeline">
        <div v-for="day in nextWeek?.days || []" :key="day.date" class="timeline-card">
          <div class="timeline-card-header">
            <strong>{{ formatDateLabel(day.date) }}</strong>
            <span class="status-badge" :class="summaryTone(day.toSchool, day.homebound)">
              {{ day.toSchool || day.homebound ? t('schedule.status.arranged') : t('schedule.status.none') }}
            </span>
          </div>
          <p class="muted">{{ t('schedule.status.toSchool', { value: day.toSchool ? t('schedule.status.riding') : t('schedule.status.notRiding') }) }}</p>
          <p class="muted">{{ t('schedule.status.homebound', { value: day.homebound ? t('schedule.status.riding') : t('schedule.status.notRiding') }) }}</p>
        </div>
      </div>
      </section>
    </div>
  </div>
</template>
