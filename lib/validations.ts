import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(72),
})

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['NURSE', 'EN', 'PCA', 'FACILITY'], {
    errorMap: () => ({ message: 'Invalid role selected' }),
  }),
})

export const AcceptShiftSchema = z.object({
  shiftId: z.string().uuid('Invalid shift ID'),
})

export const ShiftRequestSchema = z.object({
  role: z.enum(['NURSE', 'EN', 'PCA'], { errorMap: () => ({ message: 'Invalid role' }) }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type SignupInput = z.infer<typeof SignupSchema>
export type AcceptShiftInput = z.infer<typeof AcceptShiftSchema>
export type ShiftRequestInput = z.infer<typeof ShiftRequestSchema>
