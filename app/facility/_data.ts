import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export type FacilityKPIs = {
  awaiting: number
  confirmed: number
  completed: number
  totalHours: number
  fillRate: number
}

export async function getFacilityContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACILITY_ADMIN')) redirect('/login')

  let facility = null
  if (dbUser.facilityId) {
    facility = await prisma.facility.findUnique({ where: { id: dbUser.facilityId } })
  }
  if (!facility) {
    facility = await prisma.$transaction(async tx => {
      const f = await tx.facility.create({
        data: { name: `${dbUser.name ?? 'My'} Facility`, address: 'Address to be configured' },
      })
      await tx.user.update({ where: { id: dbUser.id }, data: { facilityId: f.id } })
      return f
    })
  }

  const allShifts = await prisma.shift.findMany({
    where: { facilityId: facility.id, status: { not: 'CANCELLED' } },
    select: { status: true, startTime: true, endTime: true },
  })

  const awaiting = allShifts.filter(s => s.status === 'PENDING').length
  const confirmed = allShifts.filter(s => s.status === 'MATCHED' || s.status === 'CLOCKED_IN').length
  const completed = allShifts.filter(s => s.status === 'COMPLETED').length
  const totalHours = allShifts
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3600000), 0)
  const total = awaiting + confirmed + completed
  const fillRate = total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0

  return {
    facility,
    dbUser,
    kpis: { awaiting, confirmed, completed, totalHours, fillRate } satisfies FacilityKPIs,
  }
}

export async function getFacilityShifts(facilityId: string) {
  return prisma.shift.findMany({
    where: { facilityId },
    include: { worker: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { startTime: 'desc' },
    take: 100,
  })
}

export async function getFacilityWorkers(facilityId: string) {
  const workerRows = await prisma.shift.findMany({
    where: { facilityId, workerId: { not: null } },
    select: { workerId: true },
    distinct: ['workerId'],
  })
  const ids = workerRows.map(r => r.workerId!).filter(Boolean)
  if (ids.length === 0) return []

  return prisma.user.findMany({
    where: { id: { in: ids } },
    include: {
      documents: { select: { docType: true, status: true, expiresAt: true } },
      assignedShifts: {
        where: { facilityId, status: 'COMPLETED' },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getFacilityComplianceDocs(facilityId: string) {
  const workerRows = await prisma.shift.findMany({
    where: { facilityId, workerId: { not: null } },
    select: { workerId: true },
    distinct: ['workerId'],
  })
  const ids = workerRows.map(r => r.workerId!).filter(Boolean)
  if (ids.length === 0) return []

  return prisma.complianceDocument.findMany({
    where: { userId: { in: ids } },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { expiresAt: 'asc' },
  })
}

export async function getFacilityAnalytics(facilityId: string) {
  const shifts = await prisma.shift.findMany({
    where: { facilityId },
    select: { role: true, status: true, startTime: true, endTime: true, hourlyRate: true },
    orderBy: { startTime: 'desc' },
  })

  const byRole = { NURSE: 0, EN: 0, PCA: 0 } as Record<string, number>
  let totalHours = 0
  const byMonth: Record<string, number> = {}

  for (const s of shifts) {
    if (s.status === 'COMPLETED') {
      const hrs = Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3600000)
      totalHours += hrs
      byRole[s.role] = (byRole[s.role] ?? 0) + 1
      const month = s.startTime.toLocaleDateString('en-AU', { month: 'short', year: '2-digit', timeZone: 'Australia/Melbourne' })
      byMonth[month] = (byMonth[month] ?? 0) + 1
    }
  }

  const total = shifts.filter(s => s.status !== 'CANCELLED').length
  const filled = shifts.filter(s => s.status === 'COMPLETED' || s.status === 'MATCHED' || s.status === 'CLOCKED_IN').length
  const cancelled = shifts.filter(s => s.status === 'CANCELLED').length

  return { shifts, byRole, byMonth, totalHours, fillRate: total > 0 ? Math.round((filled / total) * 100) : 0, cancelled }
}
