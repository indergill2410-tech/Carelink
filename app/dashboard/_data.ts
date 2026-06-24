import 'server-only'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getExpiryBucket, getDaysUntilExpiry } from '@/lib/compliance'

export const WORKER_ROLES: Role[] = [Role.NURSE, Role.EN, Role.PCA]

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') return null
  return dbUser
}

// Lightweight counts used to drive sidebar badges / alert dots on every page.
export async function getSidebarCounts() {
  const now = new Date()
  const soon = new Date(now.getTime() + 30 * 86_400_000)

  const [pendingDocs, unfilledShifts, expiringDocs, expiredDocs] = await Promise.all([
    prisma.complianceDocument.count({ where: { status: 'PENDING' } }),
    prisma.shift.count({ where: { status: 'PENDING' } }),
    prisma.complianceDocument.count({
      where: { status: 'APPROVED', expiresAt: { gte: now, lte: soon } },
    }),
    prisma.complianceDocument.count({
      where: { expiresAt: { lt: now }, status: { not: 'REJECTED' } },
    }),
  ])

  return {
    pendingDocs,
    unfilledShifts,
    expiringDocs,
    expiredDocs,
    certAlerts: pendingDocs + expiringDocs + expiredDocs,
  }
}

// Minimal facility list for the Post-a-Shift modal in the shared shell.
export async function getFacilityOptions() {
  return prisma.facility.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

// ─── Overview ────────────────────────────────────────────────────────────────
export async function getOverviewData() {
  const [shifts, workers, facilitiesCount, pendingDocs] = await Promise.all([
    prisma.shift.findMany({
      include: {
        facility: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true, email: true, role: true } },
        timesheet: { select: { id: true, status: true, clockIn: true, clockOut: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 60,
    }),
    prisma.user.findMany({
      where: { role: { in: WORKER_ROLES } },
      select: {
        id: true, name: true, email: true, role: true,
        complianceStatus: true, isActive: true, availability: true,
      },
    }),
    prisma.facility.count(),
    prisma.complianceDocument.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const compliantWorkers = workers.filter(w => w.complianceStatus === 'GREEN' && w.isActive)
  const activeShifts = shifts.filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status))
  const unfilledShifts = shifts.filter(s => s.status === 'PENDING')
  const completedShifts = shifts.filter(s => s.status === 'COMPLETED')
  const pendingTimesheets = completedShifts.filter(s => !s.timesheet || s.timesheet.status === 'PENDING_APPROVAL')
  const complianceAlerts = workers.filter(w => w.complianceStatus !== 'GREEN')
  const totalHours = completedShifts.reduce(
    (sum, s) => sum + Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000), 0,
  )

  return {
    shifts, workers, compliantWorkers, activeShifts, unfilledShifts,
    completedShifts, pendingTimesheets, complianceAlerts,
    facilitiesCount, pendingDocs, totalHours,
  }
}

// ─── Certifications ──────────────────────────────────────────────────────────
export async function getCertificationsData() {
  const now = new Date()
  const workers = await prisma.user.findMany({
    where: { role: { in: WORKER_ROLES } },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, email: true, role: true, complianceStatus: true, isActive: true,
      documents: {
        select: { id: true, docType: true, status: true, expiresAt: true, url: true, reviewNote: true, updatedAt: true },
        orderBy: { docType: 'asc' },
      },
    },
  })

  const allDocs = workers.flatMap(w =>
    w.documents.map(d => ({
      ...d,
      workerId: w.id,
      workerName: w.name ?? w.email,
      workerRole: w.role,
      bucket: getExpiryBucket(d, now),
      daysLeft: getDaysUntilExpiry(d.expiresAt, now),
    })),
  )

  const pending = allDocs.filter(d => d.status === 'PENDING')
  const expired = allDocs.filter(d => d.bucket === 'EXPIRED')
  const expiringSoon = allDocs
    .filter(d => d.bucket === 'EXPIRING_SOON' && d.status === 'APPROVED')
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))

  return { workers, allDocs, pending, expired, expiringSoon }
}

// ─── Care Team ───────────────────────────────────────────────────────────────
export async function getCareTeamData() {
  const [workers, shifts] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: WORKER_ROLES } },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, email: true, role: true, complianceStatus: true,
        isActive: true, rating: true, status: true, phone: true, skills: true,
        availability: true, createdAt: true,
        _count: { select: { assignedShifts: true } },
      },
    }),
    prisma.shift.findMany({
      where: { status: 'COMPLETED', workerId: { not: null } },
      select: { workerId: true },
    }),
  ])

  const completedByWorker = new Map<string, number>()
  for (const s of shifts) {
    if (s.workerId) completedByWorker.set(s.workerId, (completedByWorker.get(s.workerId) ?? 0) + 1)
  }

  return {
    workers: workers.map(w => ({ ...w, completedShifts: completedByWorker.get(w.id) ?? 0 })),
  }
}

// ─── Care Homes ──────────────────────────────────────────────────────────────
export async function getCareHomesData() {
  const [facilities, shifts, facilityManagers] = await Promise.all([
    prisma.facility.findMany({
      orderBy: { name: 'asc' },
      include: {
        managers: { select: { id: true, name: true, email: true, isActive: true }, orderBy: { name: 'asc' } },
      },
    }),
    prisma.shift.findMany({
      select: { id: true, facilityId: true, status: true, startTime: true, endTime: true },
    }),
    prisma.user.findMany({
      where: { role: 'FACILITY_ADMIN' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, facilityId: true, isActive: true },
    }),
  ])

  return { facilities, shifts, facilityManagers }
}

// ─── Insights ────────────────────────────────────────────────────────────────
export async function getInsightsData() {
  const [shifts, workers] = await Promise.all([
    prisma.shift.findMany({
      select: { id: true, role: true, status: true, startTime: true, endTime: true },
      orderBy: { startTime: 'desc' },
      take: 500,
    }),
    prisma.user.findMany({
      where: { role: { in: WORKER_ROLES } },
      select: { id: true, name: true, email: true, role: true, rating: true, isActive: true },
    }),
  ])

  const completed = shifts.filter(s => s.status === 'COMPLETED')
  const totalHours = completed.reduce(
    (sum, s) => sum + Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000), 0,
  )

  const monthlyMap: Record<string, { hours: number; shifts: number }> = {}
  for (const s of completed) {
    const key = s.startTime.toLocaleDateString('en-AU', { month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })
    if (!monthlyMap[key]) monthlyMap[key] = { hours: 0, shifts: 0 }
    monthlyMap[key].hours += Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000)
    monthlyMap[key].shifts += 1
  }
  const monthlyData = Object.entries(monthlyMap).slice(-6).reverse()

  return { shifts, workers, completed, totalHours, monthlyData }
}
