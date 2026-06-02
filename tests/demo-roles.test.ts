import { describe, expect, it } from 'vitest'

import {
  DEMO_EMAILS,
  DEMO_LOGIN_CONFIGS,
  DEMO_ROLE_OPTIONS,
} from '@/lib/demo-roles'

describe('demo role configuration', () => {
  it('keeps all five production demo personas exposed', () => {
    expect(DEMO_ROLE_OPTIONS.map(role => role.role)).toEqual([
      'ADMIN',
      'FACILITY',
      'NURSE',
      'EN',
      'PCA',
    ])
  })

  it('keeps UI demo cards aligned with demo login destinations', () => {
    for (const option of DEMO_ROLE_OPTIONS) {
      expect(DEMO_LOGIN_CONFIGS[option.role]).toEqual({
        email: option.email,
        destination: option.destination,
      })
    }
  })

  it('reports the same demo emails used by login', () => {
    expect(DEMO_EMAILS).toEqual(DEMO_ROLE_OPTIONS.map(role => role.email))
  })
})
