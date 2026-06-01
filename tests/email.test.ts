import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from '@/lib/email'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
})

describe('sendEmail', () => {
  it('skips sending when Resend is not configured', async () => {
    delete process.env.RESEND_API_KEY

    await expect(sendEmail({
      to: 'worker@example.com',
      subject: 'Shift Confirmed',
      text: 'You are confirmed.',
    })).resolves.toEqual({
      sent: false,
      error: 'RESEND_API_KEY is not configured',
    })
  })

  it('sends through Resend when configured', async () => {
    process.env.RESEND_API_KEY = 're_test'
    process.env.FROM_EMAIL = 'noreply@carelinkaustralia.com.au'
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    await expect(sendEmail({
      to: 'worker@example.com',
      subject: 'Shift Confirmed',
      text: 'You are confirmed.',
    })).resolves.toEqual({ sent: true })

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer re_test',
        'Content-Type': 'application/json',
      }),
    }))
  })
})
