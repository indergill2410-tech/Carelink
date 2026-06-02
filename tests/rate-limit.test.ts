import { describe, expect, it } from 'vitest'
import { getClientIp } from '@/lib/rate-limit'

describe('getClientIp', () => {
  it('uses the first x-forwarded-for address', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.10, 198.51.100.4',
      'x-real-ip': '192.0.2.1',
    })

    expect(getClientIp(headers)).toBe('203.0.113.10')
  })

  it('falls back to x-real-ip and then unknown', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': '192.0.2.1' }))).toBe('192.0.2.1')
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})
