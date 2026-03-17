<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminLookupsResponse, NotificationDeliveryResponse, RouteResponse } from '@/api/contracts'
import { formatNotificationStatus } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { t } = useI18n()
const lookups = ref<AdminLookupsResponse | null>(null)
const routes = ref<RouteResponse[]>([])
const history = ref<NotificationDeliveryResponse[]>([])
const errorMessage = ref('')

const activeRoutes = computed(() => routes.value.filter((route) => route.isActive))
const inactiveRoutes = computed(() => routes.value.filter((route) => !route.isActive))
const recentHistory = computed(() => history.value.slice(0, 5))
const managedStaffCount = computed(
  () => lookups.value?.staffProfiles.filter((staff) => staff.canManageAllRoutes).length ?? 0,
)

function directionLabel(direction: RouteResponse['direction']) {
  return direction === 1 ? t('common.tripDirection.toSchool') : t('common.tripDirection.homebound')
}

async function load() {
  try {
    const [lookupPayload, routePayload, historyPayload] = await Promise.all([
      authorizedJson<AdminLookupsResponse>(session, '/api/admin/lookups'),
      authorizedJson<RouteResponse[]>(session, '/api/routes'),
      authorizedJson<NotificationDeliveryResponse[]>(session, '/api/notifications/history'),
    ])

    lookups.value = lookupPayload
    routes.value = routePayload
    history.value = historyPayload
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('admin.messages.loadError')
  }
}

onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">{{ t('admin.hero.pill') }}</div>
        <h2>{{ t('admin.hero.title', { name: session.displayName }) }}</h2>
        <p class="muted">{{ t('admin.hero.description') }}</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>{{ t('admin.metrics.students') }}</span>
          <strong>{{ lookups?.students.length ?? 0 }}</strong>
          <small>{{ t('admin.metrics.studentsHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('admin.metrics.teachers') }}</span>
          <strong>{{ lookups?.staffProfiles.length ?? 0 }}</strong>
          <small>{{ t('admin.metrics.teachersHelp', { count: managedStaffCount }) }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('admin.metrics.activeRoutes') }}</span>
          <strong>{{ activeRoutes.length }}</strong>
          <small>{{ t('admin.metrics.activeRoutesHelp', { count: inactiveRoutes.length }) }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('admin.metrics.routes') }}</span>
          <strong>{{ routes.length }}</strong>
          <small>{{ t('admin.metrics.routesHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('admin.metrics.notifications') }}</span>
          <strong>{{ history.length }}</strong>
          <small>{{ t('admin.metrics.notificationsHelp') }}</small>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>

    <div class="grid two">
      <section class="panel">
        <div class="section-header">
          <div>
            <h3>{{ t('admin.routes.title') }}</h3>
            <p class="muted">{{ t('admin.routes.description') }}</p>
          </div>
        </div>

        <div class="route-list">
          <div v-for="route in routes.slice(0, 4)" :key="route.routeId" class="route-card">
            <div class="route-card-header">
              <div>
                <strong>{{ route.routeName }}</strong>
                <p class="muted">{{ route.campusName }} / {{ directionLabel(route.direction) }}</p>
              </div>
              <span class="status-badge" :class="route.isActive ? 'success' : 'neutral'">
                {{ route.isActive ? t('common.routeState.active') : t('common.routeState.inactive') }}
              </span>
            </div>

            <div class="tag-row">
              <span class="pill subtle">{{ t('admin.routes.stopCount', { count: route.stops.length }) }}</span>
              <span class="pill subtle">{{ t('admin.routes.teacherCount', { count: route.assignments.length }) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="section-header">
          <div>
            <h3>{{ t('admin.history.title') }}</h3>
            <p class="muted">{{ t('admin.history.description') }}</p>
          </div>
        </div>

        <div v-if="!recentHistory.length" class="empty-state">
          <strong>{{ t('admin.history.emptyTitle') }}</strong>
          <span>{{ t('admin.history.emptyDescription') }}</span>
        </div>

        <div v-else class="list">
          <div v-for="item in recentHistory" :key="item.notificationDeliveryId" class="list-card">
            <div class="section-header">
              <div>
                <strong>{{ item.recipientEmail }}</strong>
                <p class="muted">{{ item.sentAtUtc || t('common.empty.notSent') }}</p>
              </div>
              <span class="status-badge" :class="item.errorMessage ? 'danger' : item.sentAtUtc ? 'success' : 'warning'">
                {{ formatNotificationStatus(item.status, t) }}
              </span>
            </div>
            <p class="muted" style="margin: 0;">{{ item.errorMessage || t('admin.history.successFallback') }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
