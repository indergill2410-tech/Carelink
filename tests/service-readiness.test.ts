import { describe, expect, it } from 'vitest'
import { getEmailReadiness } from '@/lib/service-readiness'

describe('getEmailReadiness', () => {
  it('reports configured when Resend has an API key', () => {
    expect(getEmailReadiness({
      RESEND_API_KEY: 're_test',
      FROM_EMAIL: 'noreply@carelinkaustralia.com.au',
    })).toEqual({
      provider: 'resend',
      status: 'configured',
      from: 'configured',
    })
  })

  it('does not expose secrets and reports missing config when the API key is blank', () => {
    expect(getEmailReadiness({
      RESEND_API_KEY: '   ',
    })).toEqual({
      provider: 'resend',
      status: 'missing_config',
      from: 'default',
    })
  })
})
