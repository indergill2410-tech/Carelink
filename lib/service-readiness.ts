type EmailReadinessEnv = Record<string, string | undefined>

export function getEmailReadiness(env: EmailReadinessEnv = process.env) {
  const hasApiKey = Boolean(env.RESEND_API_KEY?.trim())
  const hasFromEmail = Boolean(env.FROM_EMAIL?.trim())

  return {
    provider: 'resend',
    status: hasApiKey ? 'configured' : 'missing_config',
    from: hasFromEmail ? 'configured' : 'default',
  } as const
}
