import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

type DemoConfig = {
  email: string
  dbRole: 'ADMIN' | 'NURSE'
  name: string
  destination: string
}

const DEMO_CONFIGS: Record<string, DemoConfig> = {
  ADMIN: {
    email: 'admin@demo.carelink.app',
    dbRole: 'ADMIN',
    name: 'Demo Admin',
    destination: '/dashboard',
  },
  FACILITY: {
    email: 'facility@demo.carelink.app',
    dbRole: 'ADMIN',
    name: 'Demo Facility Manager',
    destination: '/facility',
  },
  NURSE: {
    email: 'nurse@demo.carelink.app',
    dbRole: 'NURSE',
    name: 'Demo Nurse',
    destination: '/worker',
  },
}

function errorRedirect(req: NextRequest, msg: string) {
  return NextResponse.redirect(
    new URL('/login?error=' + encodeURIComponent(msg), req.url),
  )
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role') ?? ''
  const config = DEMO_CONFIGS[role]
  if (!config) return errorRedirect(req, 'Invalid demo role')

  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  if (!demoPassword) return errorRedirect(req, 'DEMO_ACCOUNT_PASSWORD env var not set')

  const supabase = createClient()

  // Happy path — account already provisioned correctly
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })
  if (!signInError) {
    return NextResponse.redirect(new URL(config.destination, req.url))
  }

  // Sign-in failed — account was likely created via SQL without auth.identities.
  // Delete the broken record and recreate via admin API (which sets up auth.identities).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return errorRedirect(req, 'Server not configured for demo accounts')
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find existing public.User ID so we can clean up auth.users too
  let existingId: string | null = null
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: config.email },
      select: { id: true },
    })
    existingId = dbUser?.id ?? null
  } catch { /* proceed to create */ }

  if (existingId) {
    // Delete public.User FIRST — avoids a unique-email conflict when the
    // auth trigger fires during the re-create step below.
    try { await prisma.user.delete({ where: { id: existingId } }) } catch { /* ignore */ }
    try { await adminClient.auth.admin.deleteUser(existingId) } catch { /* ignore */ }
  }

  // Create a properly provisioned auth user (auth.identities included)
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: config.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { name: config.name },
  })

  if (createError || !created?.user) {
    return errorRedirect(req, createError?.message ?? 'Could not provision demo account')
  }

  const userId = created.user.id

  // Upsert public.User with the correct role (trigger creates it as PCA/RED)
  try {
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: config.email,
        name: config.name,
        role: config.dbRole,
        complianceStatus: 'GREEN',
      },
      update: {
        role: config.dbRole,
        name: config.name,
        complianceStatus: 'GREEN',
      },
    })
  } catch {
    return errorRedirect(req, 'Database error during demo setup')
  }

  // Sign in with the fresh account
  const { error: finalError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })
  if (finalError) return errorRedirect(req, finalError.message)

  return NextResponse.redirect(new URL(config.destination, req.url))
}
