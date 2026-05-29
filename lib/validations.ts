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
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid start time').default('07:00'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid end time').default('15:00'),
  hourlyRate: z.string().optional(),
  notes: z.string().max(500).optional(),
  urgent: z.string().optional(),
})

export const ClockSchema = z.object({
  shiftId: z.string().uuid('Invalid shift ID'),
})

export const RateShiftSchema = z.object({
  shiftId: z.string().uuid(),
  rateeId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  skills: z.string().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type SignupInput = z.infer<typeof SignupSchema>
export type AcceptShiftInput = z.infer<typeof AcceptShiftSchema>
export type ShiftRequestInput = z.infer<typeof ShiftRequestSchema>
