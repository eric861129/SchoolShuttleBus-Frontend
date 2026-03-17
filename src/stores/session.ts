import { defineStore } from 'pinia'
import type { CurrentUserContextResponse, TokenResponse, UserRole } from '@/api/contracts'
import { authorizedJson, type SessionBridge, requestJson } from '@/api/http'

interface LoginPayload {
  account: string
  password: string
}

interface StoredSession {
  accessToken: string
  refreshToken: string
}

const storageKey = 'school-shuttle-bus.session'
let initializePromise: Promise<void> | null = null

export const useSessionStore = defineStore('session', {
  state: () => ({
    accessToken: null as string | null,
    refreshToken: null as string | null,
    context: null as CurrentUserContextResponse | null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.context),
    roles: (state): UserRole[] => state.context?.roles || [],
    displayName: (state) => state.context?.displayName || '未登入',
  },
  actions: {
    applyTokenEnvelope(token: TokenResponse) {
      this.accessToken = token.accessToken
      this.refreshToken = token.refreshToken
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        } satisfies StoredSession),
      )
    },
    clearSession() {
      this.accessToken = null
      this.refreshToken = null
      this.context = null
      localStorage.removeItem(storageKey)
    },
    async initialize() {
      if (this.initialized) {
        return
      }

      if (!initializePromise) {
        initializePromise = (async () => {
          const raw = localStorage.getItem(storageKey)
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Partial<StoredSession>
              this.accessToken = parsed.accessToken || null
              this.refreshToken = parsed.refreshToken || null

              if (this.accessToken) {
                await this.loadContext()
              }
            } catch {
              this.clearSession()
            }
          }

          this.initialized = true
        })().finally(() => {
          initializePromise = null
        })
      }

      return initializePromise
    },
    async login(payload: LoginPayload) {
      const token = await requestJson<TokenResponse>('/api/auth/login', {
        method: 'POST',
        body: payload,
      })

      this.applyTokenEnvelope(token)
      await this.loadContext()
    },
    async loadContext() {
      const bridge = this as unknown as SessionBridge
      this.context = await authorizedJson<CurrentUserContextResponse>(bridge, '/api/auth/context')
    },
    async logout() {
      try {
        if (this.accessToken) {
          await authorizedJson<void>(this as unknown as SessionBridge, '/api/auth/logout', { method: 'POST' })
        }
      } finally {
        this.clearSession()
      }
    },
  },
})
