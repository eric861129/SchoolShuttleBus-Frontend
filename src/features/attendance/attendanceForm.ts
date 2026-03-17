import type { RouteResponse, TripDirection } from '@/api/contracts'

export function filterRoutesByDirection(routes: RouteResponse[], direction: TripDirection) {
  return routes.filter((route) => route.direction === direction)
}

export function resolveAttendanceRouteId(routes: RouteResponse[], direction: TripDirection, currentRouteId: string) {
  const availableRoutes = filterRoutesByDirection(routes, direction)

  if (!availableRoutes.length) {
    return ''
  }

  return availableRoutes.some((route) => route.routeId === currentRouteId)
    ? currentRouteId
    : availableRoutes[0].routeId
}
