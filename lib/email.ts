type EmailPayload = {
  to: string
  subject: string
  text: string
}

export async function sendEmail({ to, subject, text }: EmailPayload): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL ?? 'noreply@carelinkaustralia.com.au'

  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY is not configured' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, text }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { sent: false, error: body || `Resend returned ${res.status}` }
    }

    return { sent: true }
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown email error' }
  }
}
