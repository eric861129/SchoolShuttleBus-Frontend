import type { UserRole } from '@/api/contracts'

export interface NavigationItem {
  label: string
  to: string
}

const adminNavigation: NavigationItem[] = [
  { label: '管理總覽', to: '/admin' },
  { label: '老師點名', to: '/attendance' },
  { label: '路線管理', to: '/routes' },
  { label: '營運作業', to: '/operations' },
]

const teacherNavigation: NavigationItem[] = [
  { label: '老師點名', to: '/attendance' },
  { label: '指派路線', to: '/routes' },
]

const familyNavigation: NavigationItem[] = [
  { label: '乘車登記', to: '/registrations' },
  { label: '本週預覽', to: '/schedule' },
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
