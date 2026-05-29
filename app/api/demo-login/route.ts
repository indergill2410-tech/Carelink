import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { provisionOneDemoAccount } from '@/lib/provision-demo-accounts'

type DemoConfig = {
  email: string
  destination: string
}

const DEMO_CONFIGS: Record<string, DemoConfig> = {
  ADMIN:    { email: 'admin@demo.carelink.app',    destination: '/dashboard' },
  FACILITY: { email: 'facility@demo.carelink.app', destination: '/facility'  },
  NURSE:    { email: 'nurse@demo.carelink.app',    destination: '/worker'    },
  EN:       { email: 'en@demo.carelink.app',       destination: '/worker'    },
  PCA:      { email: 'pca@demo.carelink.app',      destination: '/worker'    },
}

// POST — returns JSON so the client can handle navigation and timeouts.
export async function POST(req: NextRequest) {
  const body = await req.formData()
  const role = (body.get('role') as string) ?? ''
  const config = DEMO_CONFIGS[role]
  if (!config) return NextResponse.json({ error: 'Invalid demo role' }, { status: 400 })

  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  if (!demoPassword) {
    return NextResponse.json({ error: 'DEMO_ACCOUNT_PASSWORD env var not set' }, { status: 500 })
  }

  const supabase = await createClient()

  // Fast path — startup provisioning should have run already
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })
  if (!signInError) return NextResponse.json({ destination: config.destination })

  // Fallback — only provision the one requested account (~1-2s), not all 5
  await provisionOneDemoAccount(role)

  const { error: retryError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })
  if (!retryError) return NextResponse.json({ destination: config.destination })

  const errorMsg = !process.env.SUPABASE_SERVICE_ROLE_KEY
    ? 'Demo accounts not provisioned. Set SUPABASE_SERVICE_ROLE_KEY in your deployment settings.'
    : retryError.message

  return NextResponse.json({ error: errorMsg }, { status: 401 })
}
