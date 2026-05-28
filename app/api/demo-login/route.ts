import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { provisionDemoAccounts } from '@/lib/provision-demo-accounts'

type DemoConfig = {
  email: string
  destination: string
}

const DEMO_CONFIGS: Record<string, DemoConfig> = {
  ADMIN: {
    email: 'admin@demo.carelink.app',
    destination: '/dashboard',
  },
  FACILITY: {
    email: 'facility@demo.carelink.app',
    destination: '/facility',
  },
  NURSE: {
    email: 'nurse@demo.carelink.app',
    destination: '/worker',
  },
  EN: {
    email: 'en@demo.carelink.app',
    destination: '/worker',
  },
  PCA: {
    email: 'pca@demo.carelink.app',
    destination: '/worker',
  },
}

function errorRedirect(req: NextRequest, msg: string) {
  return NextResponse.redirect(
    new URL('/login?error=' + encodeURIComponent(msg), req.url),
  )
}

// POST — side-effecting route must not be GET (browsers/crawlers prefetch GET links)
export async function POST(req: NextRequest) {
  const body = await req.formData()
  const role = (body.get('role') as string) ?? ''
  const config = DEMO_CONFIGS[role]
  if (!config) return errorRedirect(req, 'Invalid demo role')

  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  if (!demoPassword) return errorRedirect(req, 'DEMO_ACCOUNT_PASSWORD env var not set')

  const supabase = createClient() // SSR client for cookie-backed sign-in

  // Fast path — startup provisioning should have run already
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })
  if (!signInError) return NextResponse.redirect(new URL(config.destination, req.url))

  // Fallback — provision this account and retry (idempotent, handles errors internally)
  await provisionDemoAccounts()

  const { error: retryError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })
  if (!retryError) return NextResponse.redirect(new URL(config.destination, req.url))

  return errorRedirect(req, retryError.message)
}
