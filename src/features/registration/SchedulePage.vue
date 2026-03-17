<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { WeeklyRegistrationResponse } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { formatDateLabel, mondayOfWeek, nextWeekMonday } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
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
    errorMessage.value = error instanceof ApiError ? error.message : '載入預覽失敗，請稍後再試。'
  }
}

onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">每週預覽</div>
        <h2>快速查看本週與下週安排</h2>
        <p class="muted">不必再切回編輯畫面，也能一眼看出哪些日子有搭乘、哪些還是空白。</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>本週搭乘天數</span>
          <strong>{{ currentWeekDays }}</strong>
          <small>目前週次中至少有一趟搭乘的天數</small>
        </div>
        <div class="metric-card">
          <span>本週總趟次</span>
          <strong>{{ currentWeekTrips }}</strong>
          <small>去程與回程一起計算</small>
        </div>
        <div class="metric-card">
          <span>下週已預填天數</span>
          <strong>{{ nextWeekDays }}</strong>
          <small>可先用來確認是否需要再調整</small>
        </div>
        <div class="metric-card">
          <span>下週總趟次</span>
          <strong>{{ nextWeekTrips }}</strong>
          <small>Demo 時可順手展示預填效果</small>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

    <div class="grid two">
      <section class="panel">
      <div class="section-header">
        <div>
          <h3>本週乘車安排</h3>
          <p class="muted">適合快速確認今天到本週剩餘天數的搭乘狀況。</p>
        </div>
        <span class="pill subtle">{{ currentWeek?.weekStart || mondayOfWeek() }}</span>
      </div>

      <div v-if="!(currentWeek?.days.length)" class="empty-state">
        <strong>目前沒有可顯示的本週資料</strong>
        <span>先到乘車登記頁完成設定，就會同步出現在這裡。</span>
      </div>

      <div v-else class="timeline">
        <div v-for="day in currentWeek?.days || []" :key="day.date" class="timeline-card">
          <div class="timeline-card-header">
            <strong>{{ formatDateLabel(day.date) }}</strong>
            <span class="status-badge" :class="summaryTone(day.toSchool, day.homebound)">
              {{ day.toSchool || day.homebound ? '已有安排' : '未搭乘' }}
            </span>
          </div>
          <p class="muted">去程：{{ day.toSchool ? '搭乘' : '不搭乘' }}</p>
          <p class="muted">回程：{{ day.homebound ? '搭乘' : '不搭乘' }}</p>
        </div>
      </div>
      </section>

      <section class="panel">
      <div class="section-header">
        <div>
          <h3>下週預填結果</h3>
          <p class="muted">可在 Demo 時展示上一週複製與預先規劃的成果。</p>
        </div>
        <span class="pill subtle">{{ nextWeek?.weekStart || nextWeekMonday() }}</span>
      </div>

      <div v-if="!(nextWeek?.days.length)" class="empty-state">
        <strong>目前沒有預填資料</strong>
        <span>可以先在乘車登記頁複製上一週或手動設定，下週預覽就會同步更新。</span>
      </div>

      <div v-else class="timeline">
        <div v-for="day in nextWeek?.days || []" :key="day.date" class="timeline-card">
          <div class="timeline-card-header">
            <strong>{{ formatDateLabel(day.date) }}</strong>
            <span class="status-badge" :class="summaryTone(day.toSchool, day.homebound)">
              {{ day.toSchool || day.homebound ? '已有安排' : '未搭乘' }}
            </span>
          </div>
          <p class="muted">去程：{{ day.toSchool ? '搭乘' : '不搭乘' }}</p>
          <p class="muted">回程：{{ day.homebound ? '搭乘' : '不搭乘' }}</p>
        </div>
      </div>
      </section>
    </div>
  </div>
</template>
