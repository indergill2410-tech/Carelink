const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SITE_URL',
] as const

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate required env vars at startup so missing config fails fast
    const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k])
    if (missing.length > 0) {
      const message = `[startup] Missing required environment variables: ${missing.join(', ')}`
      if (process.env.NODE_ENV === 'production') throw new Error(message)
      console.error(message)
    }

    if (process.env.ENABLE_DEMO_ACCOUNTS === 'true') {
      const { provisionDemoAccounts } = await import('./lib/provision-demo-accounts')
      // Fire-and-forget — demo account drift must not block normal startup.
      provisionDemoAccounts().catch(err => console.error('[demo] startup provision failed:', err))
    }
  }
}
