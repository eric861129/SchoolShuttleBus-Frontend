import { describe, expect, it } from 'vitest'
import type { RouteResponse } from '@/api/contracts'
import { filterRoutesByDirection, resolveAttendanceRouteId } from '@/features/attendance/attendanceForm'

const routes: RouteResponse[] = [
  {
    routeId: 'dismissal-route',
    routeName: 'Dismissal Route B',
    routeType: 1,
    direction: 2,
    campusName: 'Kang Chiao Linkou',
    isActive: true,
    stops: [],
    assignments: [],
  },
  {
    routeId: 'morning-route',
    routeName: 'Morning Route B',
    routeType: 1,
    direction: 1,
    campusName: 'Kang Chiao Linkou',
    isActive: true,
    stops: [],
    assignments: [],
  },
]

describe('attendanceForm helpers', () => {
  it('filters routes to the selected trip direction', () => {
    expect(filterRoutesByDirection(routes, 1).map((route) => route.routeId)).toEqual(['morning-route'])
    expect(filterRoutesByDirection(routes, 2).map((route) => route.routeId)).toEqual(['dismissal-route'])
  })

  it('falls back to the first valid route when the current selection does not match the direction', () => {
    expect(resolveAttendanceRouteId(routes, 1, 'dismissal-route')).toBe('morning-route')
    expect(resolveAttendanceRouteId(routes, 2, 'morning-route')).toBe('dismissal-route')
  })

  it('clears the selection when no routes are available for the chosen direction', () => {
    expect(resolveAttendanceRouteId(routes, 1, 'missing-route')).toBe('morning-route')
    expect(resolveAttendanceRouteId([], 1, 'morning-route')).toBe('')
  })
})
