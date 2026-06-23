type ServiceReadinessEnv = Record<string, string | undefined>

function getSafeErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return 'unknown'

  const maybeCode = 'code' in error ? error.code : undefined
  if (typeof maybeCode === 'string' && maybeCode.trim()) return maybeCode

  const maybeName = 'name' in error ? error.name : undefined
  if (typeof maybeName === 'string' && maybeName.trim()) return maybeName

  return 'unknown'
}

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

export function getDatabaseReadiness(env: ServiceReadinessEnv = process.env) {
  return {
    provider: 'postgresql',
    status: env.DATABASE_URL?.trim() ? 'configured' : 'missing_config',
  } as const
}

export function getDatabaseFailure(error: unknown, env: ServiceReadinessEnv = process.env) {
  return {
    ...getDatabaseReadiness(env),
    status: 'unreachable',
    errorCode: getSafeErrorCode(error),
  } as const
}
