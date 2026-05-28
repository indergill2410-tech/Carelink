'use server'

import { revalidatePath } from 'next/cache'
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

export async function demoLogin(formData: FormData) {
  const role = formData.get('demo_role') as string
  if (!['ADMIN', 'FACILITY', 'NURSE', 'EN', 'PCA'].includes(role)) {
    redirect('/login?error=Invalid+demo+role')
  }

  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  if (!demoPassword) redirect('/login?error=Demo+accounts+not+configured')

  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEMO_ACCOUNTS) {
    redirect('/login?error=Demo+not+available')
  }

  const email = `${role.toLowerCase()}@demo.com`
  const name = `Demo ${role}`
  const supabase = createClient()

  let { data: authData, error } = await supabase.auth.signInWithPassword({ email, password: demoPassword })

  if (error) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: demoPassword,
      options: { data: { name, requested_role: role } },
    })
    if (signUpError) redirect('/login?error=' + encodeURIComponent(signUpError.message))

    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      const mappedRole = (role === 'FACILITY' ? 'ADMIN' : role) as 'ADMIN' | 'NURSE' | 'EN' | 'PCA'
      await prisma.user.update({
        where: { id: signUpData.user!.id },
        data: { role: mappedRole, name, complianceStatus: 'GREEN' },
      })
    } catch (e) {
      console.error('Demo role update error', e)
    }
  }

  if (role === 'ADMIN') redirect('/dashboard')
  if (role === 'FACILITY') redirect('/facility')
  redirect('/worker')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
