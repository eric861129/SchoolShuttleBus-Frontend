<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminLookupsResponse, RouteResponse } from '@/api/contracts'
import { routeTypeOptions, tripDirectionOptions } from '@/api/contracts'
import { authorizedJson, ApiError } from '@/api/http'
import AppModal from '@/features/shared/AppModal.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { t } = useI18n()
const routes = ref<RouteResponse[]>([])
const lookups = ref<AdminLookupsResponse | null>(null)
const selectedRouteId = ref('')
const createForm = ref({
  routeName: '',
  routeType: 1 as RouteResponse['routeType'],
  direction: 1 as RouteResponse['direction'],
  campusName: 'Kang Chiao Linkou',
})
const editForm = ref({
  routeName: '',
  routeType: 1 as RouteResponse['routeType'],
  isActive: true,
})
const stops = ref<{ sequence: number; stopName: string; address: string; handoffContactName: string; handoffContactPhone: string }[]>([])
const assignStaffProfileId = ref('')
const errorMessage = ref('')
const statusMessage = ref('')
const isEditModalOpen = ref(false)

const selectedRoute = computed(() => routes.value.find((route) => route.routeId === selectedRouteId.value) || null)
const isAdministrator = computed(() => session.roles.includes('Administrator'))
const activeRouteCount = computed(() => routes.value.filter((route) => route.isActive).length)
const stopCount = computed(() => routes.value.reduce((sum, route) => sum + route.stops.length, 0))
const translatedRouteTypeOptions = computed(() =>
  routeTypeOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)
const translatedTripDirectionOptions = computed(() =>
  tripDirectionOptions.map((item) => ({ ...item, label: t(item.labelKey) })),
)

function directionLabel(direction: RouteResponse['direction']) {
  const matched = translatedTripDirectionOptions.value.find((item) => item.value === direction)
  return matched?.label || t('common.fallback.unknownDirection')
}

function routeTypeLabel(routeType: RouteResponse['routeType']) {
  const matched = translatedRouteTypeOptions.value.find((item) => item.value === routeType)
  return matched?.label || t('common.fallback.unknownType')
}

function syncSelectedRoute() {
  if (!selectedRoute.value) {
    return
  }

  editForm.value = {
    routeName: selectedRoute.value.routeName,
    routeType: selectedRoute.value.routeType,
    isActive: selectedRoute.value.isActive,
  }

  stops.value = selectedRoute.value.stops.map((stop) => ({
    sequence: stop.sequence,
    stopName: stop.stopName,
    address: stop.address,
    handoffContactName: stop.handoffContactName || '',
    handoffContactPhone: stop.handoffContactPhone || '',
  }))
  assignStaffProfileId.value = ''
}

async function load() {
  try {
    routes.value = await authorizedJson<RouteResponse[]>(session, '/api/routes')
    selectedRouteId.value = selectedRouteId.value || routes.value[0]?.routeId || ''

    if (isAdministrator.value) {
      lookups.value = await authorizedJson<AdminLookupsResponse>(session, '/api/admin/lookups')
    }

    syncSelectedRoute()
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('routes.messages.loadError')
  }
}

async function createRoute() {
  try {
    const route = await authorizedJson<RouteResponse>(session, '/api/routes', {
      method: 'POST',
      body: createForm.value,
    })

    statusMessage.value = t('routes.messages.createSuccess', { routeName: route.routeName })
    await load()
    selectedRouteId.value = route.routeId
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('routes.messages.createError')
  }
}

async function saveRoute() {
  if (!selectedRoute.value) {
    return
  }

  try {
    await authorizedJson<RouteResponse>(session, `/api/routes/${selectedRoute.value.routeId}`, {
      method: 'PATCH',
      body: editForm.value,
    })

    await authorizedJson<RouteResponse>(session, `/api/routes/${selectedRoute.value.routeId}/stops`, {
      method: 'POST',
      body: {
        stops: stops.value,
      },
    })

    if (assignStaffProfileId.value) {
      await authorizedJson<RouteResponse>(session, `/api/routes/assignments/${selectedRoute.value.routeId}`, {
        method: 'POST',
        body: { staffProfileId: assignStaffProfileId.value },
      })
    }

    statusMessage.value = t('routes.messages.saveSuccess')
    await load()
    isEditModalOpen.value = false
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : t('routes.messages.saveError')
  }
}

function addStop() {
  stops.value.push({
    sequence: stops.value.length + 1,
    stopName: '',
    address: '',
    handoffContactName: '',
    handoffContactPhone: '',
  })
}

function openEditModal(routeId: string) {
  selectedRouteId.value = routeId
  syncSelectedRoute()
  isEditModalOpen.value = true
}

watch(selectedRouteId, syncSelectedRoute)
onMounted(load)
</script>

<template>
  <div class="grid">
    <section class="panel dashboard-hero">
      <div class="hero-copy">
        <div class="pill">{{ isAdministrator ? t('routes.hero.adminPill') : t('routes.hero.teacherPill') }}</div>
        <h2>{{ isAdministrator ? t('routes.hero.adminTitle') : t('routes.hero.teacherTitle') }}</h2>
        <p class="muted">{{ t('routes.hero.description') }}</p>
      </div>

      <div class="stats-grid">
        <div class="metric-card">
          <span>{{ t('routes.metrics.routeCount') }}</span>
          <strong>{{ routes.length }}</strong>
          <small>{{ t('routes.metrics.routeCountHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('routes.metrics.activeRouteCount') }}</span>
          <strong>{{ activeRouteCount }}</strong>
          <small>{{ t('routes.metrics.activeRouteCountHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('routes.metrics.stopCount') }}</span>
          <strong>{{ stopCount }}</strong>
          <small>{{ t('routes.metrics.stopCountHelp') }}</small>
        </div>
        <div class="metric-card">
          <span>{{ t('routes.metrics.selectedRoute') }}</span>
          <strong>{{ selectedRoute?.routeName || t('common.empty.notSelected') }}</strong>
          <small>{{ selectedRoute ? `${directionLabel(selectedRoute.direction)} / ${routeTypeLabel(selectedRoute.routeType)}` : t('routes.metrics.selectedRouteHelp') }}</small>
        </div>
      </div>
    </section>

    <div class="grid two">
      <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ isAdministrator ? t('routes.createPanel.adminTitle') : t('routes.createPanel.teacherTitle') }}</h3>
          <p class="muted">{{ isAdministrator ? t('routes.createPanel.adminDescription') : t('routes.createPanel.teacherDescription') }}</p>
        </div>
      </div>

      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>

      <div v-if="isAdministrator" class="tool-card" style="margin-bottom: 18px;">
        <div class="form-grid">
          <div class="field">
            <label>{{ t('common.labels.routeName') }}</label>
            <input v-model="createForm.routeName" />
          </div>
          <div class="field">
            <label>{{ t('common.labels.campus') }}</label>
            <input v-model="createForm.campusName" />
          </div>
          <div class="field">
            <label>{{ t('common.labels.routeType') }}</label>
            <select v-model="createForm.routeType">
              <option v-for="item in translatedRouteTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t('common.labels.direction') }}</label>
            <select v-model="createForm.direction">
              <option v-for="item in translatedTripDirectionOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
        </div>

        <div class="button-row">
          <button class="button" type="button" @click="createRoute">{{ t('routes.createPanel.createButton') }}</button>
        </div>
      </div>

      <div class="route-list">
        <div
          v-for="route in routes"
          :key="route.routeId"
          class="route-card"
          :class="{ active: route.routeId === selectedRouteId }"
        >
          <div class="route-card-header">
            <div>
              <strong>{{ route.routeName }}</strong>
              <p class="muted">{{ directionLabel(route.direction) }} / {{ route.campusName }}</p>
            </div>
            <span class="status-badge" :class="route.isActive ? 'success' : 'neutral'">
              {{ route.isActive ? t('common.routeState.active') : t('common.routeState.inactive') }}
            </span>
          </div>

          <div class="tag-row">
            <span class="pill subtle">{{ routeTypeLabel(route.routeType) }}</span>
            <span class="pill subtle">{{ t('routes.routeCard.stopCount', { count: route.stops.length }) }}</span>
            <span class="pill subtle">{{ t('routes.routeCard.teacherCount', { count: route.assignments.length }) }}</span>
          </div>

          <div class="route-card-actions">
            <button class="button-ghost" type="button" @click="openEditModal(route.routeId)">{{ t('common.actions.edit') }}</button>
          </div>
        </div>
      </div>
      </section>

      <section class="panel">
      <div class="section-header">
        <div>
          <h3>{{ t('routes.editPanel.title') }}</h3>
          <p class="muted">{{ t('routes.editPanel.description') }}</p>
        </div>
      </div>

      <div v-if="!selectedRoute" class="empty-state">
        <strong>{{ t('routes.editPanel.emptyTitle') }}</strong>
        <span>{{ t('routes.editPanel.emptyDescription') }}</span>
      </div>

      <div v-else class="stack">
        <div class="stats-grid">
          <div class="stat-card">
            <span>{{ t('common.labels.routeName') }}</span>
            <strong>{{ selectedRoute.routeName }}</strong>
            <small>{{ selectedRoute.campusName }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('routes.editPanel.directionType') }}</span>
            <strong>{{ directionLabel(selectedRoute.direction) }}</strong>
            <small>{{ routeTypeLabel(selectedRoute.routeType) }}</small>
          </div>
          <div class="stat-card">
            <span>{{ t('routes.editPanel.stopCount') }}</span>
            <strong>{{ stops.length }}</strong>
            <small>{{ t('routes.editPanel.stopCountHelp') }}</small>
          </div>
        </div>

        <div class="button-row">
          <button class="button" type="button" @click="openEditModal(selectedRoute.routeId)">{{ t('common.actions.edit') }}</button>
        </div>
      </div>
      </section>
    </div>

    <AppModal
      v-model="isEditModalOpen"
      :title="t('routes.editPanel.title')"
      :description="t('routes.editPanel.description')"
      width="wide"
      :close-label="t('common.actions.close')"
    >
      <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
      <div v-if="statusMessage" class="alert success">{{ statusMessage }}</div>

      <div v-if="selectedRoute" class="stack">
        <div class="form-grid">
          <div class="field">
            <label>{{ t('common.labels.routeName') }}</label>
            <input v-model="editForm.routeName" />
          </div>
          <div class="field">
            <label>{{ t('common.labels.routeType') }}</label>
            <select v-model="editForm.routeType">
              <option v-for="item in translatedRouteTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t('common.labels.activeStatus') }}</label>
            <select v-model="editForm.isActive">
              <option :value="true">{{ t('routes.form.active') }}</option>
              <option :value="false">{{ t('routes.form.inactive') }}</option>
            </select>
          </div>
          <div v-if="isAdministrator" class="field">
            <label>{{ t('common.labels.assignedTeacher') }}</label>
            <select v-model="assignStaffProfileId">
              <option value="">{{ t('common.empty.noChange') }}</option>
              <option v-for="staff in lookups?.staffProfiles || []" :key="staff.staffProfileId" :value="staff.staffProfileId">
                {{ staff.employeeNumber }} / {{ staff.fullName }}
              </option>
            </select>
          </div>
        </div>

        <div class="section-header">
          <div>
            <h3>{{ t('routes.form.stopSettingsTitle') }}</h3>
            <p class="muted">{{ t('routes.form.stopSettingsDescription') }}</p>
          </div>
          <button class="button-secondary" type="button" @click="addStop">{{ t('common.actions.addStop') }}</button>
        </div>

        <div class="list">
          <div v-for="stop in stops" :key="stop.sequence" class="stop-card">
            <div class="form-grid">
              <div class="field">
                <label>{{ t('routes.form.sequence') }}</label>
                <input v-model.number="stop.sequence" type="number" min="1" />
              </div>
              <div class="field">
                <label>{{ t('routes.form.stopName') }}</label>
                <input v-model="stop.stopName" />
              </div>
              <div class="field">
                <label>{{ t('routes.form.address') }}</label>
                <input v-model="stop.address" />
              </div>
              <div class="field">
                <label>{{ t('routes.form.handoffName') }}</label>
                <input v-model="stop.handoffContactName" />
              </div>
              <div class="field">
                <label>{{ t('routes.form.handoffPhone') }}</label>
                <input v-model="stop.handoffContactPhone" />
              </div>
            </div>
          </div>
        </div>

        <div class="button-row">
          <button v-if="isAdministrator" class="button" type="button" @click="saveRoute">{{ t('routes.editPanel.saveButton') }}</button>
        </div>
      </div>
    </AppModal>
  </div>
</template>
