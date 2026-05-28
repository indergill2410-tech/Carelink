'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function login(formData: FormData) {
  const supabase = createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  // Check the user's role in Prisma to route them correctly
  if (authData.user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authData.user.id }
    })

    if (dbUser?.role === 'ADMIN') {
      redirect('/dashboard')
    } else if (dbUser?.role === 'NURSE' || dbUser?.role === 'EN' || dbUser?.role === 'PCA') {
      redirect('/worker')
    }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  // For the MVP, we let them pick their role on signup.
  // In production, you would verify this later.
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string // 'NURSE', 'FACILITY', or 'ADMIN'
  const name = formData.get('name') as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
        requested_role: role
      }
    }
  })

  if (error) {
    redirect('/login?error=' + error.message)
  }

  // NOTE: The Supabase trigger we created earlier automatically inserts them into the Prisma table.
  // However, because we just added 'requested_role' to the metadata, we can update our SQL trigger later.
  // For now, we manually update the Prisma record to ensure they get the right role if the trigger defaulted them to NURSE.

  if (authData.user) {
    // Small delay to ensure the Supabase Trigger finished inserting the row first
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      if (role === 'FACILITY') {
        // We don't have a FACILITY role in the User enum, facilities are separate.
        // For MVP, we'll make them an ADMIN so they can see the dashboard, 
        // but normally they would get a special FACILITY_MANAGER role.
        await prisma.user.update({
          where: { id: authData.user.id },
          data: { role: 'ADMIN', name: name }
        })
        redirect('/facility')
      } else if (role === 'ADMIN') {
        await prisma.user.update({
          where: { id: authData.user.id },
          data: { role: 'ADMIN', name: name }
        })
        redirect('/dashboard')
      } else {
        // They are a worker
        await prisma.user.update({
          where: { id: authData.user.id },
          data: { role: 'NURSE', name: name }
        })
        redirect('/worker')
      }
    } catch (e) {
      console.error("Error updating role post-signup:", e)
      redirect('/worker') // Default fallback
    }
  }

  redirect('/login?message=Check email to continue sign in process')
}
