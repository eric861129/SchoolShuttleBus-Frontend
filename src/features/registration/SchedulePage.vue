<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { WeeklyRegistrationResponse } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { formatDateLabel, mondayOfWeek, nextWeekMonday } from '@/shared/date'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const studentId = session.context?.students[0]?.studentId || ''
const currentWeek = ref<WeeklyRegistrationResponse | null>(null)
const nextWeek = ref<WeeklyRegistrationResponse | null>(null)
const errorMessage = ref('')

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
  <div class="grid two">
    <section class="panel">
      <div class="section-header">
        <h3>本週乘車安排</h3>
      </div>
      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      <div class="list">
        <div v-for="day in currentWeek?.days || []" :key="day.date" class="list-card">
          <strong>{{ formatDateLabel(day.date) }}</strong>
          <p class="muted">去程：{{ day.toSchool ? '搭乘' : '不搭乘' }} / 回程：{{ day.homebound ? '搭乘' : '不搭乘' }}</p>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <h3>下週預填結果</h3>
      </div>
      <div class="list">
        <div v-for="day in nextWeek?.days || []" :key="day.date" class="list-card">
          <strong>{{ formatDateLabel(day.date) }}</strong>
          <p class="muted">去程：{{ day.toSchool ? '搭乘' : '不搭乘' }} / 回程：{{ day.homebound ? '搭乘' : '不搭乘' }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
