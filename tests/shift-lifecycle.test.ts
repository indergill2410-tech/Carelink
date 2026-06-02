import { describe, expect, it } from 'vitest'

import {
  canCancelShift,
  shouldNotifyWorkerAboutCancellation,
} from '@/lib/shift-lifecycle'

describe('shift lifecycle helpers', () => {
  it('allows cancellation before a shift is on duty', () => {
    expect(canCancelShift('PENDING')).toBe(true)
    expect(canCancelShift('MATCHED')).toBe(true)
  })

  it('blocks cancellation after clock-in or completion', () => {
    expect(canCancelShift('CLOCKED_IN')).toBe(false)
    expect(canCancelShift('COMPLETED')).toBe(false)
    expect(canCancelShift('CANCELLED')).toBe(false)
  })

  it('notifies workers only when an assigned shift is cancelled', () => {
    expect(shouldNotifyWorkerAboutCancellation('MATCHED', 'worker-id')).toBe(true)
    expect(shouldNotifyWorkerAboutCancellation('PENDING', null)).toBe(false)
    expect(shouldNotifyWorkerAboutCancellation('CLOCKED_IN', 'worker-id')).toBe(false)
  })
})
