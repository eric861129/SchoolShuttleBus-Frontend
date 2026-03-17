import type { UserRole } from '@/api/contracts'

export interface NavigationItem {
  label: string
  to: string
  description: string
}

const adminNavigation: NavigationItem[] = [
  { label: '管理總覽', to: '/admin', description: '掌握人數、路線與通知狀態' },
  { label: '老師點名', to: '/attendance', description: '建立班車點名並即時更新狀態' },
  { label: '路線管理', to: '/routes', description: '編輯站點、指派老師與調整啟用狀態' },
  { label: '營運作業', to: '/operations', description: '調度、廣播與報表下載入口' },
]

const teacherNavigation: NavigationItem[] = [
  { label: '老師點名', to: '/attendance', description: '快速建立點名並標記學生上下車' },
  { label: '指派路線', to: '/routes', description: '查看與維護自己負責的班車路線' },
]

const familyNavigation: NavigationItem[] = [
  { label: '乘車登記', to: '/registrations', description: '完成下週上下學搭乘安排' },
  { label: '本週預覽', to: '/schedule', description: '快速檢視本週與下週的乘車狀態' },
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
