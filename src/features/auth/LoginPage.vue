<script setup lang="ts">
import { reactive } from 'vue'
import { demoAccounts } from '@/features/auth/demoAccounts'

defineProps<{
  busy?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  authenticate: [{ account: string; password: string }]
}>()

const form = reactive({
  account: '',
  password: '',
})

const demoDescriptions: Record<string, string> = {
  '管理員 Demo': '查看營運總覽、通知與報表流程',
  '老師 Demo': '建立點名、更新學生搭乘狀態',
  '家長 Demo': '完成每週乘車登記與預覽',
  '學生 Demo': '快速確認自己的乘車安排',
}

function submit(account = form.account, password = form.password) {
  emit('authenticate', { account, password })
}
</script>

<template>
  <div class="login-screen">
    <div class="panel login-card">
      <section class="login-hero">
        <div class="eyebrow">School Shuttle Bus Demo</div>
        <h1 class="hero-title">康橋智慧交通車管理系統</h1>
        <p class="hero-subtitle">
          把家長登記、老師點名與管理端營運集中在同一個入口，讓明天的 Demo 可以順著角色流程自然切換。
        </p>
        <div class="metric-grid" style="margin-top: 28px;">
          <div class="metric-card">
            <span>家長 / 學生</span>
            <strong>每週搭乘登記</strong>
            <small>快速完成上下學班車安排</small>
          </div>
          <div class="metric-card">
            <span>老師</span>
            <strong>行動點名作業</strong>
            <small>即時標記已上車、請假與缺席</small>
          </div>
          <div class="metric-card">
            <span>管理端</span>
            <strong>路線 / 通知 / 報表</strong>
            <small>用營運總覽快速確認系統狀態</small>
          </div>
        </div>
      </section>

      <section class="login-side">
        <div class="section-header">
          <div>
            <h2>登入系統</h2>
            <p class="muted">可以直接使用 Demo 帳號快速切換角色，或手動輸入帳號密碼。</p>
          </div>
        </div>

        <div class="shortcut-grid">
          <button
            v-for="demo in demoAccounts"
            :key="demo.label"
            class="shortcut-card"
            type="button"
            :aria-label="demo.label"
            :disabled="busy"
            @click="submit(demo.account, demo.password)"
          >
            <strong>{{ demo.label }}</strong>
            <span>{{ demoDescriptions[demo.label] }}</span>
          </button>
        </div>

        <div class="surface-note" style="margin-top: 18px;">
          建議從「家長 Demo」或「管理員 Demo」開始，比較容易完整展示登記與營運兩段流程。所有 Demo 帳號密碼皆為
          `P@ssw0rd!`。
        </div>

        <div class="field" style="margin-top: 18px;">
          <label for="account">登入帳號</label>
          <input id="account" v-model="form.account" autocomplete="username" placeholder="E0001 / T0001 / 0900-000-003 / S10001" />
          <small>可輸入員工編號、手機號碼或學生帳號。</small>
        </div>

        <div class="field" style="margin-top: 14px;">
          <label for="password">登入密碼</label>
          <input id="password" v-model="form.password" type="password" autocomplete="current-password" placeholder="P@ssw0rd!" />
        </div>

        <div v-if="errorMessage" class="alert error" style="margin-top: 14px;">
          {{ errorMessage }}
        </div>

        <div class="button-row" style="margin-top: 18px;">
          <button class="button" type="button" :disabled="busy" @click="submit()">
            {{ busy ? '登入中...' : '登入系統' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
