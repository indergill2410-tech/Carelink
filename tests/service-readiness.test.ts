import { describe, expect, it } from 'vitest'
import { getEmailReadiness, getStorageReadiness } from '@/lib/service-readiness'

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

describe('getStorageReadiness', () => {
  it('reports configured when Supabase storage env is present', () => {
    expect(getStorageReadiness({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test',
    })).toEqual({
      provider: 'supabase-storage',
      bucket: 'compliance-docs',
      status: 'configured',
    })
  })

  it('reports missing config without exposing the service role key', () => {
    expect(getStorageReadiness({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: '',
    })).toEqual({
      provider: 'supabase-storage',
      bucket: 'compliance-docs',
      status: 'missing_config',
    })
  })
})
