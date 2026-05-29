import { describe, expect, it } from 'vitest'

import {
  AcceptShiftSchema,
  LoginSchema,
  ShiftRequestSchema,
  SignupSchema,
} from '@/lib/validations'

describe('validation schemas', () => {
  it('accepts valid login credentials', () => {
    expect(LoginSchema.safeParse({
      email: 'worker@example.com',
      password: 'correct-horse',
    }).success).toBe(true)
  })

  it('rejects malformed login emails', () => {
    expect(LoginSchema.safeParse({
      email: 'not-an-email',
      password: 'correct-horse',
    }).success).toBe(false)
  })

  it('accepts supported signup roles', () => {
    expect(SignupSchema.safeParse({
      email: 'nurse@example.com',
      password: 'password123',
      name: 'Nora Nurse',
      role: 'NURSE',
    }).success).toBe(true)
  })

  it('rejects invalid shift identifiers', () => {
    expect(AcceptShiftSchema.safeParse({ shiftId: 'shift-123' }).success).toBe(false)
  })

  it('requires ISO date strings for shift requests', () => {
    expect(ShiftRequestSchema.safeParse({
      role: 'PCA',
      date: '2026-05-29',
    }).success).toBe(true)

    expect(ShiftRequestSchema.safeParse({
      role: 'PCA',
      date: '29/05/2026',
    }).success).toBe(false)
  })
})
