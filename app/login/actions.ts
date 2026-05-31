'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { LoginSchema, SignupSchema } from '@/lib/validations'

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) redirect('/login?error=Invalid+email+or+password')

  const supabase = await createClient()
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
  if (dbRole === 'FACILITY_ADMIN') redirect('/facility')
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
  const phoneRaw = (formData.get('phone') as string)?.trim() || undefined
  if (phoneRaw) {
    const e164Regex = /^\+[1-9]\d{1,14}$/
    if (!e164Regex.test(phoneRaw)) {
      redirect('/login?error=' + encodeURIComponent('Invalid phone number. Use E.164 format, e.g. +61412345678.'))
    }
  }
  const phone = phoneRaw

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    phone: phone || undefined,
    options: { data: { name, requested_role: role } },
  })
  if (error) redirect('/login?error=' + encodeURIComponent(error.message))

  if (authData.user) {
    const userId   = authData.user.id
    const dbRole   = role === 'FACILITY' ? ('FACILITY_ADMIN' as const) : (role as 'NURSE' | 'EN' | 'PCA')
    const destination = role === 'FACILITY' ? '/facility' : '/worker'
    const phoneData = phone ? { phone } : {}

    // Retry up to 5 times with 500ms back-off — Supabase auth trigger that
    // inserts the User row may not have fired yet when signUp resolves.
    let lastErr: unknown
    let upsertOk = false
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 500 * attempt))
      try {
        await prisma.user.upsert({
          where:  { id: userId },
          update: { role: dbRole, name, ...phoneData },
          create: { id: userId, email, role: dbRole, name, ...phoneData },
        })
        upsertOk = true
        break
      } catch (err) {
        lastErr = err
      }
    }

    if (!upsertOk) {
      console.error('[signup] DB upsert failed after retries:', lastErr)
      redirect('/login?error=' + encodeURIComponent('Account created but profile setup failed. Please sign in.'))
    }

    // Email verification gate — redirect if email not yet confirmed
    if (!authData.user.email_confirmed_at) {
      redirect('/login?message=check-email')
    }

    redirect(destination)
  }
  redirect('/login')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
