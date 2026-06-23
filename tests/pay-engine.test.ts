import { describe, expect, it } from 'vitest'

import {
  calculateShiftPay,
  getRoleRateFloor,
  normaliseOfferedRate,
} from '@/lib/pay-engine'

describe('pay engine', () => {
  it('keeps offered rates at or above the internal role floor', () => {
    expect(getRoleRateFloor('NURSE')).toBe(55)
    expect(normaliseOfferedRate('PCA', 25)).toBe(32.5)
    expect(normaliseOfferedRate('EN', 52)).toBe(52)
  })

  it('calculates ordinary shift pay without incentives', () => {
    const quote = calculateShiftPay({
      role: 'EN',
      hourlyRate: 45,
      startTime: new Date('2026-06-22T00:00:00.000Z'),
      endTime: new Date('2026-06-22T08:00:00.000Z'),
    })

    expect(quote.hours).toBe(8)
    expect(quote.basePay).toBe(360)
    expect(quote.extras).toBe(0)
    expect(quote.total).toBe(360)
  })

  it('adds weekend, night, urgent, and ERTC incentive components', () => {
    const quote = calculateShiftPay({
      role: 'NURSE',
      hourlyRate: 55,
      urgent: true,
      startTime: new Date('2026-06-20T12:00:00.000Z'),
      endTime: new Date('2026-06-20T20:00:00.000Z'),
    })

    expect(quote.hours).toBe(8)
    expect(quote.weekendHours).toBe(8)
    expect(quote.nightHours).toBeGreaterThan(0)
    expect(quote.components.map(component => component.code)).toEqual([
      'WEEKEND_LOADING',
      'NIGHT_LOADING',
      'URGENT_UPLIFT',
      'ERTC_INCENTIVE',
    ])
    expect(quote.total).toBeGreaterThan(quote.basePay)
  })

  it('returns zero totals for invalid time windows', () => {
    const quote = calculateShiftPay({
      role: 'PCA',
      hourlyRate: 32.5,
      startTime: new Date('2026-06-22T08:00:00.000Z'),
      endTime: new Date('2026-06-22T08:00:00.000Z'),
    })

    expect(quote.hours).toBe(0)
    expect(quote.total).toBe(0)
    expect(quote.effectiveHourlyRate).toBe(0)
  })
})
