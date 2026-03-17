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

function submit(account = form.account, password = form.password) {
  emit('authenticate', { account, password })
}
</script>

<template>
  <div class="login-screen">
    <div class="panel login-card">
      <section class="login-hero">
        <div class="pill">Mobile-first / Role-aware</div>
        <h1 style="font-size: 2.3rem; margin: 18px 0 10px;">康橋智慧交通車管理系統</h1>
        <p>這個前端提供家長、學生、老師與管理員共用的單一入口，直接串接已部署在 Azure 上的 backend API。</p>
        <div class="metric-grid" style="margin-top: 26px;">
          <div class="metric-card">
            <span class="muted">家長 / 學生</span>
            <strong>每週搭乘登記</strong>
          </div>
          <div class="metric-card">
            <span class="muted">老師</span>
            <strong>行動點名作業</strong>
          </div>
          <div class="metric-card">
            <span class="muted">管理端</span>
            <strong>路線 / 通知 / 報表</strong>
          </div>
        </div>
      </section>

      <section class="login-side">
        <div class="section-header">
          <div>
            <h2>登入系統</h2>
            <p class="muted">可以直接使用 demo 帳號快速登入，或手動輸入帳號密碼。</p>
          </div>
        </div>

        <div class="shortcut-grid">
          <button
            v-for="demo in demoAccounts"
            :key="demo.label"
            class="button-secondary"
            type="button"
            :disabled="busy"
            @click="submit(demo.account, demo.password)"
          >
            {{ demo.label }}
          </button>
        </div>

        <div class="field">
          <label for="account">登入帳號</label>
          <input id="account" v-model="form.account" autocomplete="username" placeholder="E0001 / T0001 / 0900-000-003 / S10001" />
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
