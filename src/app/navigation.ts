import type { UserRole } from '@/api/contracts'

export interface NavigationItem {
  labelKey: string
  to: string
  descriptionKey: string
}

const adminNavigation: NavigationItem[] = [
  { labelKey: 'nav.adminOverview.label', to: '/admin', descriptionKey: 'nav.adminOverview.description' },
  { labelKey: 'nav.attendance.label', to: '/attendance', descriptionKey: 'nav.attendance.descriptionAdmin' },
  { labelKey: 'nav.routes.labelAdmin', to: '/routes', descriptionKey: 'nav.routes.descriptionAdmin' },
  { labelKey: 'nav.operations.label', to: '/operations', descriptionKey: 'nav.operations.description' },
]

const teacherNavigation: NavigationItem[] = [
  { labelKey: 'nav.attendance.label', to: '/attendance', descriptionKey: 'nav.attendance.descriptionTeacher' },
  { labelKey: 'nav.routes.labelTeacher', to: '/routes', descriptionKey: 'nav.routes.descriptionTeacher' },
]

const familyNavigation: NavigationItem[] = [
  { labelKey: 'nav.registrations.label', to: '/registrations', descriptionKey: 'nav.registrations.description' },
  { labelKey: 'nav.schedule.label', to: '/schedule', descriptionKey: 'nav.schedule.description' },
]

export function buildNavigation(roles: UserRole[]) {
  if (roles.includes('Administrator')) {
    return adminNavigation
  }

  if (roles.includes('Teacher')) {
    return teacherNavigation
  }

  return familyNavigation
}

export function resolveHomePath(roles: UserRole[]) {
  return buildNavigation(roles)[0]?.to || '/login'
}
