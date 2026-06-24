'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { fromZonedTime } from 'date-fns-tz'
import { Role } from '@prisma/client'
import { notifyShiftCancelled } from '@/lib/notifications'
import { canCancelShift, shouldNotifyWorkerAboutCancellation } from '@/lib/shift-lifecycle'
import { normaliseOfferedRate, ROLE_RATE_FLOORS } from '@/lib/pay-engine'

const TZ = 'Australia/Melbourne'

async function getFacilityUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACILITY_ADMIN')) return null
  return dbUser
}

export async function cancelShift(formData: FormData) {
  const dbUser = await getFacilityUser()
  if (!dbUser) return

  const shiftId = formData.get('shiftId') as string
  if (!shiftId) return

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { facility: { select: { name: true } } },
  })
  if (!shift) return
  if (dbUser.role === 'FACILITY_ADMIN' && shift.facilityId !== dbUser.facilityId) return
  if (!canCancelShift(shift.status)) return

  await prisma.shift.update({ where: { id: shiftId }, data: { status: 'CANCELLED' } })

  if (shouldNotifyWorkerAboutCancellation(shift.status, shift.workerId) && shift.workerId) {
    await notifyShiftCancelled(shift.workerId, shift.facility.name, shift.id)
  }

  revalidatePath('/facility')
  revalidatePath('/facility/shifts')
  revalidatePath('/dashboard')
  revalidatePath('/worker/my-shifts')
}

export async function requestShift(formData: FormData) {
  const dbUser = await getFacilityUser()
  if (!dbUser) return

  const role = formData.get('role') as string
  const date = formData.get('date') as string
  const startT = (formData.get('startTime') as string) || '07:00'
  const endT = (formData.get('endTime') as string) || '15:00'
  const notes = (formData.get('notes') as string) || null
  const urgent = formData.get('urgent') === 'on'
  const repeatWeeksRaw = parseInt((formData.get('repeatWeeks') as string) || '1', 10)
  const repeatWeeks = Number.isFinite(repeatWeeksRaw) ? Math.min(Math.max(repeatWeeksRaw, 1), 12) : 1

  const VALID_ROLES = ['NURSE', 'EN', 'PCA']
  if (!role || !VALID_ROLES.includes(role) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    redirect('/facility?error=Invalid+shift+details')
  }

  const facilityId = dbUser.facilityId
  if (!facilityId) redirect('/facility?error=No+facility+linked')

  const facility = await prisma.facility.findUnique({ where: { id: facilityId } })
  if (!facility) redirect('/facility?error=Facility+not+found')

  const startTime = fromZonedTime(`${date}T${startT}:00`, TZ)
  let endTime = fromZonedTime(`${date}T${endT}:00`, TZ)
  if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime()) && endTime <= startTime) {
    endTime = new Date(endTime.getTime() + 24 * 60 * 60 * 1000)
  }
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || startTime >= endTime) {
    redirect('/facility?error=Invalid+time+range')
  }

  const baseRate = (facility.defaultRate ? Number(facility.defaultRate) : null) ?? ROLE_RATE_FLOORS[role as keyof typeof ROLE_RATE_FLOORS] ?? 45.00
  const hourlyRate = normaliseOfferedRate(role, baseRate)

  await prisma.shift.createMany({
    data: Array.from({ length: repeatWeeks }, (_, index) => {
      const weekDate = new Date(`${date}T00:00:00Z`)
      weekDate.setUTCDate(weekDate.getUTCDate() + index * 7)
      const weekDateStr = weekDate.toISOString().split('T')[0]
      const weekStart = fromZonedTime(`${weekDateStr}T${startT}:00`, TZ)
      let weekEnd = fromZonedTime(`${weekDateStr}T${endT}:00`, TZ)
      if (weekEnd <= weekStart) weekEnd = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000)
      return { facilityId, role: role as Role, startTime: weekStart, endTime: weekEnd, hourlyRate, notes, urgent, status: 'PENDING' }
    }),
  })

  revalidatePath('/facility')
  revalidatePath('/facility/shifts')
  revalidatePath('/dashboard')
  redirect('/facility')
}

export async function updateFacilitySettings(formData: FormData) {
  const dbUser = await getFacilityUser()
  if (!dbUser) return

  const name = ((formData.get('name') as string) || '').trim()
  const address = ((formData.get('address') as string) || '').trim()
  const phone = ((formData.get('phone') as string) || '').trim() || null
  const email = ((formData.get('email') as string) || '').trim() || null
  if (!name || !address) return

  const facilityId = dbUser.facilityId
  if (!facilityId) return
  if (dbUser.role === 'FACILITY_ADMIN' && dbUser.facilityId !== facilityId) return

  await prisma.facility.update({ where: { id: facilityId }, data: { name, address, phone, email } })
  revalidatePath('/facility')
  revalidatePath('/dashboard')
}
