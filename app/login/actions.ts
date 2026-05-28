'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'


export async function login(formData: FormData) {
  const supabase = createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)
  if (error) redirect('/login?error=Could not authenticate user')

  if (authData.user) {
    const dbUser = await prisma.user.findUnique({ where: { id: authData.user.id } })
    if (dbUser?.role === 'ADMIN') redirect('/dashboard')
    if (dbUser?.role === 'NURSE' || dbUser?.role === 'EN' || dbUser?.role === 'PCA') redirect('/worker')
  }
  redirect('/facility')
}

export async function signup(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string 
  const name = formData.get('name') as string

  const { data: authData, error } = await supabase.auth.signUp({
    email, password, options: { data: { name, requested_role: role } }
  })

  if (error) redirect('/login?error=' + error.message)

  if (authData.user) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    try {
      if (role === 'FACILITY') {
        await prisma.user.update({ where: { id: authData.user.id }, data: { role: 'ADMIN', name } })
        redirect('/facility')
      } else if (role === 'ADMIN') {
        await prisma.user.update({ where: { id: authData.user.id }, data: { role: 'ADMIN', name } })
        redirect('/dashboard')
      } else {
        await prisma.user.update({ where: { id: authData.user.id }, data: { role: 'NURSE', name } })
        redirect('/worker')
      }
    } catch (e) {
      redirect('/worker')
    }
  }
  redirect('/login')
}

export async function demoLogin(formData: FormData) {
  const role = formData.get('demo_role') as string
  const email = `${role.toLowerCase()}@demo.com`
  const password = 'DemoPassword123!'
  const name = `Demo ${role}`

  const supabase = createClient()

  // 1. Try to log in
  let { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  // 2. If it fails, create the demo account
  if (error) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email, password, options: { data: { name, requested_role: role } }
    })

    if (signUpError) redirect(`/login?error=Demo setup failed: ${signUpError.message}`)

    // Give trigger time
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      const mappedRole = (role === 'FACILITY' ? 'ADMIN' : role) as 'ADMIN' | 'NURSE' | 'EN' | 'PCA'
      await prisma.user.update({
        where: { id: signUpData.user!.id },
        data: { role: mappedRole, name, complianceStatus: 'GREEN' } // Make demo nurses GREEN so they look good
      })
    } catch (e) {
      console.log("Demo role update error", e)
    }
  }

  // 3. Route to proper dashboard
  if (role === 'ADMIN') redirect('/dashboard')
  if (role === 'FACILITY') redirect('/facility')
  redirect('/worker')
}
