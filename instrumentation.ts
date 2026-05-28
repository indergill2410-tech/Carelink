export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { provisionDemoAccounts } = await import('./lib/provision-demo-accounts')
    // Fire-and-forget — must not block server startup
    provisionDemoAccounts().catch(err => console.error('[demo] startup provision failed:', err))
  }
}
