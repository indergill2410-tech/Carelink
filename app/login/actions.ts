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

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, requested_role: role } },
  })
  if (error) redirect('/login?error=' + encodeURIComponent(error.message))

  if (authData.user) {
    // Wait briefly for the auth trigger to insert the row before we upsert
    await new Promise(resolve => setTimeout(resolve, 1500))
    let destination = '/worker'
    try {
      if (role === 'FACILITY') {
        await prisma.user.upsert({
          where: { id: authData.user.id },
          update: { role: 'ADMIN', name },
          create: { id: authData.user.id, email, role: 'ADMIN', name },
        })
        destination = '/facility'
      } else {
        const dbRole = role as 'NURSE' | 'EN' | 'PCA'
        await prisma.user.upsert({
          where: { id: authData.user.id },
          update: { role: dbRole, name },
          create: { id: authData.user.id, email, role: dbRole, name },
        })
      }
    } catch (err) {
      console.error('[signup] DB upsert failed:', err)
      redirect('/login?error=' + encodeURIComponent('Account created but profile setup failed. Please sign in.'))
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
