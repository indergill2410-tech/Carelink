import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { getComplianceStatusForDocuments, getDaysUntilExpiry, COMPLIANCE_DOCUMENTS } from '@/lib/compliance'
import { isShiftAllowedByAvailability } from '@/lib/availability'
import { calculateShiftPay } from '@/lib/pay-engine'

const TZ = 'Australia/Melbourne'
const DAY_MS = 86_400_000

/** YYYY-MM-DD for a date as seen in Melbourne. */
function melbourneDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ,
  }).formatToParts(date)
  const by = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return `${by.year}-${by.month}-${by.day}`
}

/** Monday 00:00 (Melbourne) of the ISO week containing `now`, as a UTC Date. */
function startOfMelbourneWeek(now: Date): Date {
  // Day-of-week in Melbourne (0=Sun..6=Sat)
  const wdName = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ }).format(now)
  const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dow = order.indexOf(wdName)
  const daysSinceMonday = (dow + 6) % 7
  // Midnight (Melbourne) today, approximated then snapped back to the week start.
  const todayKey = melbourneDateKey(now)
  const [y, m, d] = todayKey.split('-').map(Number)
  // Melbourne is UTC+10/+11; construct local midnight then subtract the offset.
  const localMidnightUtc = Date.UTC(y, m - 1, d) // treats key as UTC midnight
  return new Date(localMidnightUtc - daysSinceMonday * DAY_MS)
}

export type WorkerHome = Awaited<ReturnType<typeof getWorkerHome>>

export async function getWorkerHome() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const now = new Date()
  const weekStart = startOfMelbourneWeek(now)

  const [documents, myShifts, openShifts, sameRoleWorkers] = await Promise.all([
    prisma.complianceDocument.findMany({ where: { userId: user.id } }),
    prisma.shift.findMany({
      where: { workerId: user.id },
      include: { facility: { select: { id: true, name: true, address: true } } },
      orderBy: { startTime: 'asc' },
    }),
    prisma.shift.findMany({
      where: { status: 'PENDING', workerId: null, role: dbUser.role },
      include: { facility: { select: { id: true, name: true, address: true } } },
      orderBy: [{ urgent: 'desc' }, { startTime: 'asc' }],
    }),
    prisma.user.findMany({
      where: { role: dbUser.role, rating: { not: null } },
      select: { id: true, rating: true },
    }),
  ])

  // Keep compliance status fresh (mirrors existing behaviour).
  const complianceStatus = getComplianceStatusForDocuments(dbUser.role, documents)
  if (complianceStatus !== dbUser.complianceStatus) {
    await prisma.user.update({ where: { id: dbUser.id }, data: { complianceStatus } })
    dbUser.complianceStatus = complianceStatus
  }

  // ── Earnings this week (from completed shifts) ──────────────────────────
  const completed = myShifts.filter(s => s.status === 'COMPLETED')
  const weekCompleted = completed.filter(s => s.endTime >= weekStart)
  const weekEarnings = weekCompleted.reduce((sum, s) => sum + calculateShiftPay(s).total, 0)

  // 7-day mini bars (Mon→Sun of the current week), keyed by Melbourne date.
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(weekStart.getTime() + i * DAY_MS)
    const key = melbourneDateKey(dayStart)
    const amount = completed
      .filter(s => melbourneDateKey(s.endTime) === key)
      .reduce((sum, s) => sum + calculateShiftPay(s).total, 0)
    return { key, label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i], amount }
  })

  const totalShifts = completed.length
  const distinctFacilities = new Set(completed.map(s => s.facility.id)).size

  // Performer percentile by rating among same-role workers (live-derived).
  let percentile: number | null = null
  if (dbUser.rating != null && sameRoleWorkers.length > 1) {
    const beaten = sameRoleWorkers.filter(w => (w.rating ?? 0) < dbUser.rating!).length
    percentile = Math.round((beaten / (sameRoleWorkers.length - 1)) * 100)
  }

  // ── Credential alert (any required doc expiring within 60 days) ─────────
  const labelByType = new Map(COMPLIANCE_DOCUMENTS.map(d => [d.key, d.label]))
  const expiringSoon = documents
    .map(d => ({ docType: d.docType, days: getDaysUntilExpiry(d.expiresAt, now) }))
    .filter(d => d.days !== null && d.days <= 60)
    .map(d => ({ label: labelByType.get(d.docType as never) ?? d.docType, days: d.days! }))
    .sort((a, b) => a.days - b.days)

  // ── Today's shift ───────────────────────────────────────────────────────
  const todayKey = melbourneDateKey(now)
  const todaysShift = myShifts.find(
    s => ['MATCHED', 'CLOCKED_IN'].includes(s.status) && melbourneDateKey(s.startTime) === todayKey,
  ) ?? null

  // ── Coming up (future confirmed, excluding today's) ─────────────────────
  const comingUp = myShifts
    .filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status) && s.endTime >= now && s.id !== todaysShift?.id)
    .slice(0, 4)

  // ── New offers (open shifts matching role + availability) ───────────────
  const offers = openShifts
    .filter(s => isShiftAllowedByAvailability(dbUser.availability, s.startTime))
    .slice(0, 3)

  return {
    user: dbUser,
    isCompliant: complianceStatus === 'GREEN',
    earnings: {
      weekTotal: weekEarnings,
      bars: weekBars,
      hasHistory: completed.length > 0,
    },
    stats: {
      rating: dbUser.rating,
      totalShifts,
      distinctFacilities,
      percentile,
    },
    expiringSoon,
    todaysShift,
    comingUp,
    offers,
  }
}

/** Open shifts the worker is eligible for, for the browse feed. */
export async function getEligibleShifts() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const [documents, openShifts] = await Promise.all([
    prisma.complianceDocument.findMany({ where: { userId: user.id } }),
    prisma.shift.findMany({
      where: { status: 'PENDING', workerId: null },
      include: { facility: { select: { id: true, name: true, address: true } } },
      orderBy: [{ urgent: 'desc' }, { startTime: 'asc' }],
    }),
  ])

  const complianceStatus = getComplianceStatusForDocuments(dbUser.role, documents)
  if (complianceStatus !== dbUser.complianceStatus) {
    await prisma.user.update({ where: { id: dbUser.id }, data: { complianceStatus } })
    dbUser.complianceStatus = complianceStatus
  }

  return { user: dbUser, openShifts, isCompliant: complianceStatus === 'GREEN' }
}
