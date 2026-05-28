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

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: authData.user!.id } })
    if (!dbUser) redirect('/login?error=Account+not+found')
    if (dbUser.role === 'ADMIN') redirect('/dashboard')
    if (['NURSE', 'EN', 'PCA'].includes(dbUser.role)) redirect('/worker')
    redirect('/facility')
  } catch {
    redirect('/login?error=Server+error')
  }
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
    try {
      if (role === 'FACILITY') {
        await prisma.user.update({
          where: { id: authData.user.id },
          data: { role: 'ADMIN', name },
        })
        redirect('/facility')
      } else {
        const dbRole = role as 'NURSE' | 'EN' | 'PCA'
        await prisma.user.update({
          where: { id: authData.user.id },
          data: { role: dbRole, name },
        })
        redirect('/worker')
      }
    } catch {
      redirect('/worker')
    }
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

  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  if (!demoPassword) redirect('/login?error=Demo+accounts+not+configured+%E2%80%94+set+DEMO_ACCOUNT_PASSWORD')

  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEMO_ACCOUNTS) {
    redirect('/login?error=Demo+accounts+are+disabled+in+production')
  }

  const supabase = createClient()

  // Happy path: account already exists — just sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })

  if (!signInError) redirect(config.destination)

  // First-time setup: create a pre-confirmed account via the admin API.
  // Using signUp() with the anon key creates an unconfirmed account that can't
  // log in when email confirmation is enabled — the admin API bypasses that.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    redirect('/login?error=Demo+setup+requires+SUPABASE_SERVICE_ROLE_KEY')
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

  // Upsert the User record — safe whether the auth trigger has already
  // fired (update path) or hasn't yet (create path).
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
