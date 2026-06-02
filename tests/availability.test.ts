import { describe, expect, it } from 'vitest'
import {
  emptyAvailability,
  getShiftAvailabilitySlot,
  hasAvailability,
  isShiftAllowedByAvailability,
} from '../lib/availability'

describe('worker availability matching', () => {
  it('treats empty availability as open availability', () => {
    const shift = new Date('2026-06-01T23:00:00+10:00')

    expect(hasAvailability(emptyAvailability())).toBe(false)
    expect(isShiftAllowedByAvailability(emptyAvailability(), shift)).toBe(true)
  })

  it('matches a shift to its Melbourne day and period', () => {
    const shift = new Date('2026-06-01T07:00:00+10:00')

    expect(getShiftAvailabilitySlot(shift)).toEqual({ day: 'mon', period: 'am' })
  })

  it('blocks shifts outside selected periods', () => {
    const availability = emptyAvailability()
    availability.mon.am = true

    expect(isShiftAllowedByAvailability(availability, new Date('2026-06-01T07:00:00+10:00'))).toBe(true)
    expect(isShiftAllowedByAvailability(availability, new Date('2026-06-01T15:00:00+10:00'))).toBe(false)
  })
})
