import { describe, expect, it } from 'vitest'
import { buildNavigation, resolveHomePath } from '@/app/navigation'

describe('navigation', () => {
  it('builds the admin navigation tree with operational pages', () => {
    const navigation = buildNavigation(['Administrator'])

    expect(resolveHomePath(['Administrator'])).toBe('/admin')
    expect(navigation.map((item: { to: string }) => item.to)).toEqual([
      '/admin',
      '/attendance',
      '/routes',
      '/operations',
    ])
  })

  it('builds the parent navigation tree around registration flow', () => {
    const navigation = buildNavigation(['Parent'])

    expect(resolveHomePath(['Parent'])).toBe('/registrations')
    expect(navigation.map((item: { to: string }) => item.to)).toEqual([
      '/registrations',
      '/schedule',
    ])
  })
})
