<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resolveHomePath } from '@/app/navigation'
import { ApiError } from '@/api/http'
import LoginPage from '@/features/auth/LoginPage.vue'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const session = useSessionStore()
const busy = ref(false)
const errorMessage = ref('')

async function handleSubmit(payload: { account: string; password: string }) {
  busy.value = true
  errorMessage.value = ''

  try {
    await session.login(payload)
    await router.replace(resolveHomePath(session.roles))
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : '登入失敗，請稍後再試。'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <LoginPage :busy="busy" :error-message="errorMessage" @authenticate="handleSubmit" />
</template>
