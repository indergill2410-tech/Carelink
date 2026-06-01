import { describe, expect, it } from 'vitest'
import { isValidE164Phone } from '@/lib/phone'

describe('isValidE164Phone', () => {
  it('accepts valid E.164 phone numbers', () => {
    expect(isValidE164Phone('+61412345678')).toBe(true)
    expect(isValidE164Phone('+14155552671')).toBe(true)
  })

  it('rejects local, malformed, and overlong phone numbers', () => {
    expect(isValidE164Phone('0412345678')).toBe(false)
    expect(isValidE164Phone('+61 412 345 678')).toBe(false)
    expect(isValidE164Phone('+0123456789')).toBe(false)
    expect(isValidE164Phone('+1234567890123456')).toBe(false)
  })
})
