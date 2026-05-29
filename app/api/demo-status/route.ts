import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEMO_EMAILS = [
  'admin@demo.carelink.app',
  'facility@demo.carelink.app',
  'nurse@demo.carelink.app',
  'en@demo.carelink.app',
  'pca@demo.carelink.app',
]

// GET /api/demo-status — operator diagnostic endpoint (no auth required, no secrets exposed)
export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DEMO_ACCOUNT_PASSWORD: !!process.env.DEMO_ACCOUNT_PASSWORD,
    DATABASE_URL: !!process.env.DATABASE_URL,
  }

  let dbAccounts: { email: string; role: string }[] = []
  let dbError: string | null = null

  try {
    dbAccounts = await prisma.user.findMany({
      where: { email: { in: DEMO_EMAILS } },
      select: { email: true, role: true },
    })
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err)
  }

  const provisioned = DEMO_EMAILS.filter(e => dbAccounts.some(u => u.email === e))
  const missing = DEMO_EMAILS.filter(e => !dbAccounts.some(u => u.email === e))

  return NextResponse.json({
    env: envVars,
    accounts: {
      provisioned,
      missing,
      ready: missing.length === 0,
    },
    dbError,
    hint: !envVars.DEMO_ACCOUNT_PASSWORD
      ? 'Set DEMO_ACCOUNT_PASSWORD on your deployment platform and redeploy.'
      : !envVars.SUPABASE_SERVICE_ROLE_KEY && missing.length > 0
        ? 'Set SUPABASE_SERVICE_ROLE_KEY on your deployment platform OR disable "Confirm email" in Supabase → Authentication → Email settings, then redeploy.'
        : missing.length > 0
          ? 'Accounts missing — trigger a redeploy so instrumentation.ts can provision them.'
          : 'All demo accounts provisioned and ready.',
  })
}
