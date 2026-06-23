import { describe, expect, it } from 'vitest'
import {
  getDatabaseFailure,
  getDatabaseReadiness,
  getEmailReadiness,
  getStorageReadiness,
} from '@/lib/service-readiness'

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

describe('getDatabaseReadiness', () => {
  it('reports configured when DATABASE_URL is present', () => {
    expect(getDatabaseReadiness({
      DATABASE_URL: 'postgresql://user:password@example.supabase.co:6543/postgres',
    })).toEqual({
      provider: 'postgresql',
      status: 'configured',
    })
  })

  it('reports missing config when DATABASE_URL is blank', () => {
    expect(getDatabaseReadiness({ DATABASE_URL: '   ' })).toEqual({
      provider: 'postgresql',
      status: 'missing_config',
    })
  })
})

describe('getDatabaseFailure', () => {
  it('reports a safe Prisma error code without exposing the raw message', () => {
    expect(getDatabaseFailure(
      Object.assign(new Error('password=secret host=private'), { code: 'P1001' }),
      { DATABASE_URL: 'postgresql://user:password@example.supabase.co:6543/postgres' },
    )).toEqual({
      provider: 'postgresql',
      status: 'unreachable',
      errorCode: 'P1001',
    })
  })

  it('falls back to the error name when no code is available', () => {
    expect(getDatabaseFailure(new TypeError('network failed'), {
      DATABASE_URL: 'postgresql://user:password@example.supabase.co:6543/postgres',
    })).toEqual({
      provider: 'postgresql',
      status: 'unreachable',
      errorCode: 'TypeError',
    })
  })
})
