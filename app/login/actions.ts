'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { LoginSchema, SignupSchema } from '@/lib/validations'

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) redirect('/login?error=Invalid+email+or+password')

  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) redirect('/login?error=' + encodeURIComponent(error.message))

  // Resolve role outside any try/catch — redirect() throws internally and
  // must not be caught by a generic catch block.
  let dbRole: string | null = null
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: authData.user!.id } })
    dbRole = dbUser?.role ?? null
  } catch {
    redirect('/login?error=Database+error.+Please+try+again.')
  }

  if (!dbRole) redirect('/login?error=Account+not+found')
  if (dbRole === 'ADMIN') redirect('/dashboard')
  if (['NURSE', 'EN', 'PCA'].includes(dbRole)) redirect('/worker')
  redirect('/facility')
}

export async function signup(formData: FormData) {
  const parsed = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    role: formData.get('role'),
  })
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid input'
    redirect('/login?error=' + encodeURIComponent(message))
  }

  const { email, password, name, role } = parsed.data

  const supabase = createClient()
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, requested_role: role } },
  })
  if (error) redirect('/login?error=' + encodeURIComponent(error.message))

  if (authData.user) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    let destination = '/worker'
    try {
      if (role === 'FACILITY') {
        await prisma.user.update({ where: { id: authData.user.id }, data: { role: 'ADMIN', name } })
        destination = '/facility'
      } else {
        const dbRole = role as 'NURSE' | 'EN' | 'PCA'
        await prisma.user.update({ where: { id: authData.user.id }, data: { role: dbRole, name } })
      }
    } catch {
      // DB update failed — auth succeeded, so let them in anyway
    }
    redirect(destination)
  }
  redirect('/login')
}

// Three pre-configured demo accounts — one per portal
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

export async function demoLogin(formData: FormData) {
  const demoRoleInput = formData.get('demo_role') as string
  const config = DEMO_CONFIGS[demoRoleInput]
  if (!config) redirect('/login?error=Invalid+demo+role')

  // Gate on password being set — if DEMO_ACCOUNT_PASSWORD is configured,
  // demo accounts are enabled regardless of NODE_ENV.
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  if (!demoPassword) redirect('/login?error=DEMO_ACCOUNT_PASSWORD+env+var+not+set')

  const supabase = createClient()

  // Happy path: account already exists — just sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })
  if (!signInError) redirect(config.destination)

  // First-time setup: provision via admin API (bypasses email confirmation)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    redirect('/login?error=SUPABASE_SERVICE_ROLE_KEY+not+configured+on+this+server')
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: config.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { name: config.name },
  })

  if (createError || !created.user) {
    redirect('/login?error=' + encodeURIComponent(createError?.message ?? 'Could not create demo account'))
  }

  // Upsert the User row — safe whether the auth trigger has already fired or not
  try {
    await prisma.user.upsert({
      where: { id: created.user.id },
      create: {
        id: created.user.id,
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
    redirect('/login?error=Database+error+during+demo+setup.+Check+DATABASE_URL.')
  }

  // Sign in with the newly created, pre-confirmed account
  const { error: finalSignInError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })

  if (finalSignInError) {
    redirect('/login?error=' + encodeURIComponent(finalSignInError.message))
  }

  redirect(config.destination)
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
