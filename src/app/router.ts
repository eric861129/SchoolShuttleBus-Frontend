import type { Pinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { UserRole } from '@/api/contracts'
import { resolveHomePath } from '@/app/navigation'
import AdminOverviewPage from '@/features/admin/AdminOverviewPage.vue'
import AttendancePage from '@/features/attendance/AttendancePage.vue'
import AuthRouteView from '@/features/auth/AuthRouteView.vue'
import OperationsPage from '@/features/operations/OperationsPage.vue'
import RegistrationsPage from '@/features/registration/RegistrationsPage.vue'
import SchedulePage from '@/features/registration/SchedulePage.vue'
import RoutesPage from '@/features/routes/RoutesPage.vue'
import NotFoundPage from '@/features/shared/NotFoundPage.vue'
import { useSessionStore } from '@/stores/session'

export function createAppRouter(pinia: Pinia) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/login' },
      { path: '/login', component: AuthRouteView, meta: { public: true, layout: 'auth' } },
      { path: '/registrations', component: RegistrationsPage, meta: { roles: ['Student', 'Parent'] satisfies UserRole[] } },
      { path: '/schedule', component: SchedulePage, meta: { roles: ['Student', 'Parent'] satisfies UserRole[] } },
      { path: '/attendance', component: AttendancePage, meta: { roles: ['Teacher', 'Administrator'] satisfies UserRole[] } },
      { path: '/routes', component: RoutesPage, meta: { roles: ['Teacher', 'Administrator'] satisfies UserRole[] } },
      { path: '/operations', component: OperationsPage, meta: { roles: ['Administrator'] satisfies UserRole[] } },
      { path: '/admin', component: AdminOverviewPage, meta: { roles: ['Administrator'] satisfies UserRole[] } },
      { path: '/:pathMatch(.*)*', component: NotFoundPage },
    ],
  })

  router.beforeEach(async (to) => {
    const session = useSessionStore(pinia)
    await session.initialize()

    if (to.meta.public) {
      return session.isAuthenticated ? resolveHomePath(session.roles) : true
    }

    if (!session.isAuthenticated) {
      return '/login'
    }

    const allowedRoles = (to.meta.roles as UserRole[] | undefined) || []
    if (allowedRoles.length > 0 && !allowedRoles.some((role) => session.roles.includes(role))) {
      return resolveHomePath(session.roles)
    }

    return true
  })

  return router
}
