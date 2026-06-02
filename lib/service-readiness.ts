type ServiceReadinessEnv = Record<string, string | undefined>

export function getEmailReadiness(env: ServiceReadinessEnv = process.env) {
  const hasApiKey = Boolean(env.RESEND_API_KEY?.trim())
  const hasFromEmail = Boolean(env.FROM_EMAIL?.trim())

  return {
    provider: 'resend',
    status: hasApiKey ? 'configured' : 'missing_config',
    from: hasFromEmail ? 'configured' : 'default',
  } as const
}

export function getStorageReadiness(env: ServiceReadinessEnv = process.env) {
  const hasSupabaseUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim())
  const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim())

  return {
    provider: 'supabase-storage',
    bucket: 'compliance-docs',
    status: hasSupabaseUrl && hasServiceRole ? 'configured' : 'missing_config',
  } as const
}
