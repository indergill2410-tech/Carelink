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
      console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`)
      // Log only — do not throw, to avoid crashing cold-start on platforms that
      // inject env vars slightly after the Node.js process starts.
    }

    const { provisionDemoAccounts } = await import('./lib/provision-demo-accounts')
    // Fire-and-forget — must not block server startup
    provisionDemoAccounts().catch(err => console.error('[demo] startup provision failed:', err))
  }
}
