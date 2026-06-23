import {
  Activity, Clock, FileWarning, Users, X, Building2,
  CheckCircle, XCircle, LayoutDashboard, TrendingUp,
  BarChart3, Star, UserCog, Power, FileCheck, Zap,
  ArrowUpRight, ArrowRight, Heart,
} from 'lucide-react'
import { fromZonedTime } from 'date-fns-tz'

const TZ = 'Australia/Melbourne'
const parseShiftTime = (s: string) => fromZonedTime(s, TZ)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, ComplianceBadge } from '@/components/StatusBadge'
import { NotificationBell } from '@/components/NotificationBell'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/login/actions'
import { createNotification, notifyFacilityShiftFilled, notifyShiftCancelled } from '@/lib/notifications'
import { getComplianceStatusForDocuments } from '@/lib/compliance'
import { isShiftAllowedByAvailability } from '@/lib/availability'
import { canCancelShift, shouldNotifyWorkerAboutCancellation } from '@/lib/shift-lifecycle'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Role, UserStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') return null
  return dbUser
}

// ─── Server Actions ───────────────────────────────────────────────────────────

async function broadcastShift(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const facilityId  = formData.get('facilityId') as string
  const role        = formData.get('role') as string
  const startTime   = formData.get('startTime') as string
  const endTime     = formData.get('endTime') as string
  const hourlyRate  = parseFloat(formData.get('hourlyRate') as string)
  const notes       = (formData.get('notes') as string) || null
  const urgent      = formData.get('urgent') === 'on'

  const start = parseShiftTime(startTime)
  const end   = parseShiftTime(endTime)

  const VALID_ROLES: string[] = ['NURSE', 'EN', 'PCA']
  if (!facilityId || !VALID_ROLES.includes(role) || isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end || isNaN(hourlyRate) || hourlyRate <= 0) {
    redirect('/dashboard?broadcast=1&error=Invalid+shift+details')
  }

  await prisma.shift.create({
    data: { facilityId, role: role as Role, status: 'PENDING', startTime: start, endTime: end, hourlyRate, notes, urgent },
  })
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

async function cancelShift(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const shiftId = formData.get('shiftId') as string
  if (!shiftId) return
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { facility: { select: { name: true } } },
  })
  if (!shift) return
  if (!canCancelShift(shift.status)) return
  await prisma.shift.update({ where: { id: shiftId }, data: { status: 'CANCELLED' } })
  if (shouldNotifyWorkerAboutCancellation(shift.status, shift.workerId) && shift.workerId) {
    await notifyShiftCancelled(shift.workerId, shift.facility.name, shift.id)
  }
  revalidatePath('/dashboard')
  revalidatePath('/facility')
  revalidatePath('/worker/my-shifts')
}

async function toggleCompliance(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const workerId = formData.get('workerId') as string
  if (!workerId) return
  await prisma.$executeRaw`
    UPDATE "User"
    SET "complianceStatus" = CASE WHEN "complianceStatus" = 'GREEN' THEN 'RED' ELSE 'GREEN' END
    WHERE id = ${workerId}
  `
  revalidatePath('/dashboard')
}

async function toggleWorkerActive(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const workerId = formData.get('workerId') as string
  if (!workerId) return
  await prisma.$executeRaw`
    UPDATE "User" SET "isActive" = NOT "isActive" WHERE id = ${workerId}
  `
  revalidatePath('/dashboard')
}

async function updateWorkerProfile(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const workerId = formData.get('workerId') as string
  const name = ((formData.get('name') as string) || '').trim() || null
  const phone = ((formData.get('phone') as string) || '').trim() || null
  const role = formData.get('role') as string
  const status = formData.get('status') as string
  const complianceStatus = formData.get('complianceStatus') as string
  const VALID_ROLES = ['NURSE', 'EN', 'PCA'] as const
  const VALID_STATUSES = ['ACTIVE', 'PENDING', 'BLOCKED'] as const
  const VALID_COMPLIANCE = ['GREEN', 'AMBER', 'RED'] as const

  if (!workerId || !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) return
  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) return
  if (!VALID_COMPLIANCE.includes(complianceStatus as typeof VALID_COMPLIANCE[number])) return

  await prisma.user.update({
    where: { id: workerId },
    data: {
      name,
      phone,
      role: role as Role,
      status: status as UserStatus,
      complianceStatus,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/worker')
  revalidatePath('/worker/profile')
}

async function saveFacility(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const facilityId = ((formData.get('facilityId') as string) || '').trim()
  const name = ((formData.get('name') as string) || '').trim()
  const address = ((formData.get('address') as string) || '').trim()
  const phone = ((formData.get('phone') as string) || '').trim() || null
  const email = ((formData.get('email') as string) || '').trim() || null
  const defaultRateRaw = ((formData.get('defaultRate') as string) || '').trim()
  const defaultRate = defaultRateRaw ? Number(defaultRateRaw) : null

  if (!name || !address) return
  if (defaultRate !== null && (!Number.isFinite(defaultRate) || defaultRate < 0 || defaultRate > 500)) return

  const data = { name, address, phone, email, defaultRate }
  if (facilityId) {
    await prisma.facility.update({ where: { id: facilityId }, data })
  } else {
    await prisma.facility.create({ data })
  }

  revalidatePath('/dashboard')
  revalidatePath('/facility')
}

async function assignFacilityManager(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const facilityId = formData.get('facilityId') as string
  const managerId = formData.get('managerId') as string
  if (!facilityId || !managerId) return

  const [facility, manager] = await Promise.all([
    prisma.facility.findUnique({ where: { id: facilityId }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: managerId }, select: { id: true, role: true } }),
  ])
  if (!facility || !manager || manager.role !== 'FACILITY_ADMIN') return

  await prisma.user.update({ where: { id: managerId }, data: { facilityId } })
  await createNotification(
    managerId,
    'Facility Assigned',
    `You have been assigned to manage ${facility.name}.`,
    '/facility',
  )

  revalidatePath('/dashboard')
  revalidatePath('/facility')
}

async function reviewDocument(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const docId      = formData.get('docId') as string
  const action     = formData.get('action') as 'APPROVED' | 'REJECTED'
  const reviewNote = (formData.get('reviewNote') as string) || null
  if (!docId || !['APPROVED','REJECTED'].includes(action)) return

  const doc = await prisma.complianceDocument.update({
    where: { id: docId },
    data: { status: action, reviewNote },
    include: { user: { select: { role: true } } },
  })
  if (doc) {
    const documents = await prisma.complianceDocument.findMany({
      where: { userId: doc.userId },
    })
    const nextComplianceStatus = getComplianceStatusForDocuments(doc.user.role, documents)
    const isNowCompliant = nextComplianceStatus === 'GREEN'
    await prisma.user.update({
      where: { id: doc.userId },
      data: { complianceStatus: nextComplianceStatus },
    })
    const docLabel = doc.docType.replace(/_/g, ' ')
    if (action === 'APPROVED') {
      await createNotification(
        doc.userId,
        isNowCompliant ? '✅ All Clear!' : '✅ Document Approved',
        isNowCompliant
          ? 'All your documents are approved. You can now accept shifts.'
          : `Your ${docLabel} has been approved.`,
        '/worker/profile',
      )
    } else {
      await createNotification(
        doc.userId,
        '⚠️ Document Needs Attention',
        reviewNote ? `${docLabel}: ${reviewNote}` : `Your ${docLabel} needs to be re-uploaded.`,
        '/worker/profile',
      )
    }
  }
  revalidatePath('/dashboard')
  revalidatePath('/worker/profile')
}

async function assignWorker(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const shiftId  = formData.get('shiftId') as string
  const workerId = formData.get('workerId') as string
  if (!shiftId || !workerId) return

  const [shift, worker] = await Promise.all([
    prisma.shift.findUnique({ where: { id: shiftId }, include: { facility: { select: { id: true, name: true } } } }),
    prisma.user.findUnique({ where: { id: workerId } }),
  ])
  if (!shift || shift.status !== 'PENDING' || !worker) return
  if (!worker.isActive || worker.complianceStatus !== 'GREEN' || worker.role !== shift.role) return
  if (!isShiftAllowedByAvailability(worker.availability, shift.startTime)) return
  await prisma.shift.update({
    where: { id: shiftId },
    data: { workerId, status: 'MATCHED' },
  })

  const dateStr = shift.startTime.toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne',
  })
  await createNotification(
    workerId,
    '📋 Shift Confirmed',
    `You have been confirmed for a ${shift.role} shift at ${shift.facility.name} on ${dateStr}.`,
    '/worker/my-shifts',
  )
  await notifyFacilityShiftFilled(
    shift.facility.id,
    worker.name ?? worker.email,
    shift.role,
    shift.id,
  )
  revalidatePath('/dashboard')
  revalidatePath('/facility')
  revalidatePath('/worker')
  revalidatePath('/worker/my-shifts')
}

async function approveTimesheet(formData: FormData) {
  'use server'
  if (!await requireAdmin()) return

  const timesheetId = (formData.get('timesheetId') as string) || null
  const shiftId = (formData.get('shiftId') as string) || null
  if (!timesheetId && !shiftId) return

  const existing = timesheetId
    ? await prisma.timesheet.findUnique({
        where: { id: timesheetId },
        include: {
          shift: {
            select: {
              id: true,
              workerId: true,
              facility: { select: { name: true } },
            },
          },
        },
      })
    : null
  if (existing && existing.status !== 'PENDING_APPROVAL') return

  const fallbackShift = !existing && shiftId
    ? await prisma.shift.findFirst({
        where: { id: shiftId, status: 'COMPLETED' },
        select: { id: true, clockInAt: true, clockOutAt: true },
      })
    : null
  if (!existing && !fallbackShift) return

  const timesheet = existing
    ? await prisma.timesheet.update({
        where: { id: existing.id },
        data: { status: 'APPROVED' },
        include: {
          shift: {
            select: {
              id: true,
              workerId: true,
              facility: { select: { name: true } },
            },
          },
        },
      })
    : await prisma.timesheet.upsert({
        where: { shiftId: fallbackShift!.id },
        create: {
          shiftId: fallbackShift!.id,
          status: 'APPROVED',
          clockIn: fallbackShift!.clockInAt,
          clockOut: fallbackShift!.clockOutAt,
        },
        update: { status: 'APPROVED' },
        include: {
          shift: {
            select: {
              id: true,
              workerId: true,
              facility: { select: { name: true } },
            },
          },
        },
      })

  if (timesheet.shift.workerId) {
    await createNotification(
      timesheet.shift.workerId,
      'Hours Approved',
      `Your hours for ${timesheet.shift.facility.name} have been approved.`,
      `/worker/pay?shift=${timesheet.shift.id}`,
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/worker/pay')
}

// ─── Data ─────────────────────────────────────────────────────────────────

async function getDashboardData() {
  const [shifts, workers, facilitiesList, facilityManagers, pendingDocs] = await Promise.all([
    prisma.shift.findMany({
      include: {
        facility: { select: { id: true, name: true, address: true } },
        worker:   { select: { id: true, name: true, email: true, role: true } },
        timesheet: { select: { id: true, status: true, clockIn: true, clockOut: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: { in: ['NURSE','EN','PCA'] } },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, role: true,
        complianceStatus: true, isActive: true,
        rating: true, facilityId: true, email: true, status: true,
        phone: true, skills: true, availability: true, createdAt: true,
      },
    }),
    prisma.facility.findMany({
      orderBy: { name: 'asc' },
      include: {
        managers: {
          select: { id: true, name: true, email: true, isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'FACILITY_ADMIN' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, facilityId: true, isActive: true },
    }),
    prisma.complianceDocument.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  const compliantWorkers = workers.filter(w => w.complianceStatus === 'GREEN' && w.isActive)

  const activeShifts    = shifts.filter(s => ['MATCHED','CLOCKED_IN'].includes(s.status))
  const unfilledShifts  = shifts.filter(s => s.status === 'PENDING')
  const completedShifts = shifts.filter(s => s.status === 'COMPLETED')
  const pendingTimesheets = completedShifts.filter(s => !s.timesheet || s.timesheet.status === 'PENDING_APPROVAL')
  const complianceAlerts = workers.filter(w => w.complianceStatus !== 'GREEN')

  const totalHours = completedShifts.reduce((sum, s) => sum + (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000, 0)

  const monthlyMap: Record<string, { hours: number; shifts: number }> = {}
  for (const s of completedShifts) {
    const key = s.startTime.toLocaleDateString('en-AU', { month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })
    if (!monthlyMap[key]) monthlyMap[key] = { hours: 0, shifts: 0 }
    monthlyMap[key].hours += (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000
    monthlyMap[key].shifts  += 1
  }
  const monthlyData = Object.entries(monthlyMap).slice(-6).reverse()

  return { shifts, workers, activeShifts, unfilledShifts, completedShifts, pendingTimesheets, complianceAlerts, facilities: facilitiesList, facilityManagers, totalHours, monthlyData, pendingDocs, compliantWorkers }
}

// ─── Tab Components ───────────────────────────────────────────────────────

function OverviewTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Activity Feed */}
      <Card className="lg:col-span-2 hover:shadow-card-hover transition-shadow duration-300">
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-teal" /> Shift Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.shifts.length === 0 ? (
            <div className="p-12 text-center text-ink/40 text-sm">
              No shifts yet — post one to get started.
            </div>
          ) : (
            <div className="divide-y divide-surface-2">
              {data.shifts.slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 ${
                    s.urgent ? 'bg-rose-100 text-rose-700' :
                    s.role === 'NURSE' ? 'bg-sky-100 text-sky-700' :
                    s.role === 'EN' ? 'bg-violet-100 text-violet-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{s.role}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink text-sm truncate">{s.facility.name}</p>
                      {s.urgent && <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-rose-200 shrink-0">URGENT</span>}
                    </div>
                    <p className="text-xs text-ink/45 mt-0.5 font-mono">
                      {s.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                      {' · '}{s.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}–{s.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                      {' · '}{s.worker?.name ?? 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={s.status} />
                    {s.status === 'PENDING' && (
                      <form action={cancelShift} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <input type="hidden" name="shiftId" value={s.id} />
                        <Button size="sm" variant="destructive" type="submit" className="h-7 text-xs px-2.5">Cancel</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Urgent Actions */}
      <div className="space-y-4">
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-500" /> Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.unfilledShifts.slice(0, 4).map(s => {
              const eligibleWorkers = data.compliantWorkers.filter(w =>
                w.role === s.role && isShiftAllowedByAvailability(w.availability, s.startTime),
              )

              return (
                <div key={s.id} className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    {s.urgent && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">URGENT</span>
                    )}
                    <p className="font-bold text-ink text-sm truncate flex-1">{s.role} · {s.facility.name}</p>
                  </div>
                  <p className="text-xs text-ink/50 font-mono">
                    {s.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                    {' · '}
                    {s.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}–{s.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                  </p>
                  {eligibleWorkers.length > 0 ? (
                    <form action={assignWorker} className="flex gap-2">
                      <input type="hidden" name="shiftId" value={s.id} />
                      <select name="workerId" className="flex-1 h-8 rounded-lg border border-surface-3 bg-white px-2 text-xs text-ink focus:outline-none focus:border-teal transition-all" required>
                        <option value="">Assign a carer…</option>
                        {eligibleWorkers.map(w => (
                          <option key={w.id} value={w.id}>{w.name ?? w.email}</option>
                        ))}
                      </select>
                      <Button size="sm" type="submit" className="h-8 px-3 text-xs shrink-0">Assign</Button>
                    </form>
                  ) : (
                    <p className="text-xs text-ink/40 italic">No verified carers available for this slot</p>
                  )}
                  <form action={cancelShift}>
                    <input type="hidden" name="shiftId" value={s.id} />
                    <Button size="sm" variant="outline" className="w-full text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50" type="submit">
                      Cancel Shift
                    </Button>
                  </form>
                </div>
              )
            })}
            {data.complianceAlerts.slice(0, 2).map(w => (
              <div key={w.id} className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="font-bold text-ink text-sm">Certification Issue</p>
                <p className="text-ink/50 text-xs mt-0.5 mb-3 truncate">{w.name ?? w.email} · {w.role}</p>
                <form action={toggleCompliance}>
                  <input type="hidden" name="workerId" value={w.id} />
                  <Button size="sm" variant="outline" className="w-full text-xs h-8 border-rose-200 text-rose-900 hover:bg-rose-100" type="submit">
                    Clear for Work
                  </Button>
                </form>
              </div>
            ))}
            {data.unfilledShifts.length === 0 && data.complianceAlerts.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink/60">Everything is on track</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Hours to Approve
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.pendingTimesheets.length === 0 ? (
              <div className="text-center py-5">
                <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink/55">All hours approved</p>
              </div>
            ) : (
              data.pendingTimesheets.slice(0, 4).map(s => {
                const clockIn = s.timesheet?.clockIn ?? s.clockInAt
                const clockOut = s.timesheet?.clockOut ?? s.clockOutAt

                return (
                  <div key={s.id} className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2.5">
                    <div>
                      <p className="font-bold text-ink text-sm truncate">
                        {s.worker?.name ?? s.worker?.email ?? 'Carer'} · {s.facility.name}
                      </p>
                      <p className="text-xs text-ink/45 font-mono mt-0.5">
                        {s.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                        {' · '}
                        {clockIn?.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' }) ?? 'No clock in'}
                        {' - '}
                        {clockOut?.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' }) ?? 'No clock out'}
                      </p>
                    </div>
                    <form action={approveTimesheet}>
                      <input type="hidden" name="shiftId" value={s.id} />
                      {s.timesheet && <input type="hidden" name="timesheetId" value={s.timesheet.id} />}
                      <Button size="sm" type="submit" className="w-full h-8 text-xs">Approve Hours</Button>
                    </form>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ComplianceTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { workers, pendingDocs } = data
  const green    = workers.filter(w => w.complianceStatus === 'GREEN')
  const nonGreen = workers.filter(w => w.complianceStatus !== 'GREEN')

  return (
    <div className="space-y-6">
      {pendingDocs.length > 0 && (
        <Card>
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="w-4 h-4 text-blue-500" />
              Documents Awaiting Review
              <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingDocs.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-surface-2">
              {pendingDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-1 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm">{doc.user.name ?? doc.user.email}</p>
                    <p className="text-xs text-ink/45 mt-0.5">{doc.user.role} · {doc.docType.replace(/_/g,' ')}</p>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:underline mt-1 inline-flex items-center gap-0.5">
                        View document <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={reviewDocument}>
                      <input type="hidden" name="docId" value={doc.id} />
                      <input type="hidden" name="action" value="APPROVED" />
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-none text-xs h-8 gap-1">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                    </form>
                    <form action={reviewDocument}>
                      <input type="hidden" name="docId" value={doc.id} />
                      <input type="hidden" name="action" value="REJECTED" />
                      <Button size="sm" variant="destructive" className="text-xs h-8 gap-1">
                        <XCircle className="w-3 h-3" /> Request Re-upload
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Verified', count: green.length, color: 'bg-emerald-50 border-emerald-200', num: 'text-emerald-700', sub: 'text-emerald-500' },
          { label: 'Needs Attention', count: nonGreen.length, color: 'bg-rose-50 border-rose-200', num: 'text-rose-700', sub: 'text-rose-500' },
          { label: 'Total Carers', count: workers.length, color: 'bg-surface-1 border-surface-3', num: 'text-ink', sub: 'text-ink/40' },
        ].map(item => (
          <div key={item.label} className={`border rounded-2xl p-5 text-center ${item.color}`}>
            <p className={`text-3xl font-black font-mono ${item.num}`}>{item.count}</p>
            <p className={`text-sm font-medium mt-1 ${item.sub}`}>{item.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">Team Readiness</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workers.length === 0 ? (
            <p className="text-ink/40 text-center py-10 text-sm">No carers registered yet.</p>
          ) : (
            <div className="divide-y divide-surface-2">
              {[...nonGreen, ...green].map(w => (
                <div key={w.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    w.complianceStatus === 'GREEN' ? 'bg-emerald-100' : 'bg-rose-100'
                  }`}>
                    {w.complianceStatus === 'GREEN'
                      ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                      : <XCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{w.name ?? '—'}</p>
                    <p className="text-xs text-ink/40">{w.email} · {w.role}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ComplianceBadge status={w.complianceStatus} />
                    <form action={toggleCompliance}>
                      <input type="hidden" name="workerId" value={w.id} />
                      <Button size="sm" variant="outline" type="submit" className="text-xs h-8 px-3">
                        {w.complianceStatus === 'GREEN' ? 'Flag for Review' : 'Clear for Work'}
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WorkforceTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { workers } = data
  const byRole = { NURSE: workers.filter(w => w.role === 'NURSE'), EN: workers.filter(w => w.role === 'EN'), PCA: workers.filter(w => w.role === 'PCA') }
  const roleCards = [
    { role: 'NURSE' as const, label: 'Registered Nurses', bg: 'bg-sky-100', icon: 'text-sky-600' },
    { role: 'EN' as const, label: 'Enrolled Nurses', bg: 'bg-violet-100', icon: 'text-violet-600' },
    { role: 'PCA' as const, label: 'Personal Care Assistants', bg: 'bg-amber-100', icon: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {roleCards.map(({ role, label, bg, icon }) => (
          <Card key={role} className="hover:shadow-card-hover transition-shadow duration-300">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${bg}`}>
                <Users className={`w-5 h-5 ${icon}`} />
              </div>
              <p className="text-3xl font-black font-mono text-ink">{byRole[role].length}</p>
              <p className="text-sm text-ink/50 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">All Care Team Members — {workers.length}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workers.length === 0 ? (
            <p className="text-ink/40 text-center py-10 text-sm">No carers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-2 bg-surface-1">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Verification</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-2">
                  {workers.map(w => (
                    <tr key={w.id} className={`hover:bg-surface-1 transition-colors ${!w.isActive ? 'opacity-45' : ''}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-ink">{w.name ?? '—'}</p>
                        <p className="text-xs text-ink/40">{w.email}</p>
                        {w.rating && (
                          <p className="text-xs text-amber-500 flex items-center gap-0.5 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400" /> {w.rating.toFixed(1)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-ink/8 text-ink">{w.role}</span>
                      </td>
                      <td className="px-4 py-3.5"><ComplianceBadge status={w.complianceStatus} /></td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${w.isActive ? 'bg-teal/10 text-teal' : 'bg-surface-2 text-ink/40'}`}>
                          {w.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5 justify-end">
                          <details className="relative">
                            <summary className="list-none">
                              <Button size="sm" variant="outline" type="button" className="text-xs h-7 px-2.5 gap-1 cursor-pointer">
                                <UserCog className="w-3 h-3" />
                                Edit
                              </Button>
                            </summary>
                            <div className="absolute right-0 top-9 z-30 w-80 rounded-2xl border border-surface-2 bg-white p-4 shadow-modal">
                              <form action={updateWorkerProfile} className="space-y-3">
                                <input type="hidden" name="workerId" value={w.id} />
                                <div>
                                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Name</label>
                                  <input name="name" defaultValue={w.name ?? ''} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Phone</label>
                                  <input name="phone" defaultValue={w.phone ?? ''} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Role</label>
                                    <select name="role" defaultValue={w.role} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-2 text-xs text-ink focus:border-teal focus:outline-none">
                                      <option value="NURSE">Registered Nurse</option>
                                      <option value="EN">Enrolled Nurse</option>
                                      <option value="PCA">Personal Care Assistant</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Account</label>
                                    <select name="status" defaultValue={w.status} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-2 text-xs text-ink focus:border-teal focus:outline-none">
                                      <option value="ACTIVE">Active</option>
                                      <option value="PENDING">Pending</option>
                                      <option value="BLOCKED">Blocked</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Verification</label>
                                  <select name="complianceStatus" defaultValue={w.complianceStatus ?? 'RED'} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-2 text-xs text-ink focus:border-teal focus:outline-none">
                                    <option value="GREEN">Verified</option>
                                    <option value="AMBER">In Review</option>
                                    <option value="RED">Incomplete</option>
                                  </select>
                                </div>
                                <Button size="sm" type="submit" className="h-9 w-full text-xs">Save</Button>
                              </form>
                            </div>
                          </details>
                          <form action={toggleCompliance}>
                            <input type="hidden" name="workerId" value={w.id} />
                            <Button size="sm" variant="outline" type="submit" className="text-xs h-7 px-2.5 gap-1">
                              <UserCog className="w-3 h-3" />
                              {w.complianceStatus === 'GREEN' ? 'Flag for Review' : 'Clear for Work'}
                            </Button>
                          </form>
                          <form action={toggleWorkerActive}>
                            <input type="hidden" name="workerId" value={w.id} />
                            <Button
                              size="sm" variant="outline" type="submit"
                              className={`text-xs h-7 px-2.5 gap-1 ${w.isActive ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                            >
                              <Power className="w-3 h-3" />
                              {w.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FacilitiesTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { facilities, shifts, facilityManagers } = data
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">Add Care Home</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form action={saveFacility} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input name="name" placeholder="Facility name" required className="h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <input name="address" placeholder="Address" required className="md:col-span-2 h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <input name="phone" placeholder="Phone" className="h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <Button type="submit" className="h-10">Add Care Home</Button>
            <input name="email" type="email" placeholder="Email" className="md:col-span-2 h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <input name="defaultRate" type="number" min="0" max="500" step="0.50" placeholder="Default rate" className="h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">All Care Homes — {facilities.length}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {facilities.length === 0 ? (
            <p className="text-ink/40 text-center py-10 text-sm">No care homes added yet.</p>
          ) : (
            <div className="divide-y divide-surface-2">
              {facilities.map(f => {
                const fs        = shifts.filter(s => s.facilityId === f.id)
                const active    = fs.filter(s => ['MATCHED','CLOCKED_IN'].includes(s.status)).length
                const pending   = fs.filter(s => s.status === 'PENDING').length
                const completed = fs.filter(s => s.status === 'COMPLETED').length

                return (
                  <div key={f.id} className="px-5 py-4 hover:bg-surface-1 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink">{f.name}</p>
                        <p className="text-xs text-ink/40 truncate">{f.address}</p>
                        <p className="text-[11px] text-ink/35 truncate">
                          {f.managers.length > 0
                            ? f.managers.map(m => m.name ?? m.email).join(', ')
                            : 'No manager assigned'}
                        </p>
                      </div>
                      <div className="flex gap-5 text-center shrink-0">
                        {[
                          { v: active,    l: 'On Shift',  c: 'text-teal' },
                          { v: pending,   l: 'Awaiting',  c: 'text-amber-600' },
                          { v: completed, l: 'Done',      c: 'text-emerald-600' },
                        ].map(item => (
                          <div key={item.l}>
                            <p className={`font-black font-mono text-sm ${item.c}`}>{item.v}</p>
                            <p className="text-[10px] text-ink/35 font-medium">{item.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-bold text-teal">Manage facility</summary>
                      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <form action={saveFacility} className="rounded-2xl border border-surface-2 bg-white p-4 space-y-3">
                          <input type="hidden" name="facilityId" value={f.id} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input name="name" defaultValue={f.name} required className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                            <input name="phone" defaultValue={f.phone ?? ''} placeholder="Phone" className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                          </div>
                          <input name="address" defaultValue={f.address} required className="h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input name="email" type="email" defaultValue={f.email ?? ''} placeholder="Email" className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                            <input name="defaultRate" type="number" min="0" max="500" step="0.50" defaultValue={f.defaultRate ? Number(f.defaultRate).toFixed(2) : ''} placeholder="Default rate" className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                          </div>
                          <Button size="sm" type="submit" className="h-9 w-full text-xs">Save Facility</Button>
                        </form>

                        <form action={assignFacilityManager} className="rounded-2xl border border-surface-2 bg-white p-4 space-y-3">
                          <input type="hidden" name="facilityId" value={f.id} />
                          <div>
                            <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Assign manager</label>
                            <select name="managerId" className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" required>
                              <option value="">Select a facility manager...</option>
                              {facilityManagers.map(manager => (
                                <option key={manager.id} value={manager.id}>
                                  {manager.name ?? manager.email}{manager.facilityId === f.id ? ' (current)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button size="sm" type="submit" className="h-9 w-full text-xs">Assign Manager</Button>
                          <div className="rounded-xl bg-surface-1 p-3">
                            <p className="text-[10px] font-bold text-ink/35 uppercase tracking-wider mb-1">Current managers</p>
                            {f.managers.length === 0 ? (
                              <p className="text-xs text-ink/35">None assigned</p>
                            ) : (
                              <div className="space-y-1">
                                {f.managers.map(manager => (
                                  <p key={manager.id} className="text-xs text-ink/55 truncate">
                                    {manager.name ?? manager.email}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </form>
                      </div>
                    </details>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { shifts, workers, monthlyData, totalHours } = data
  const completed       = shifts.filter(s => s.status === 'COMPLETED')
  const fillRate        = shifts.length > 0 ? Math.round((completed.length / shifts.length) * 100) : 0
  const avgHours        = completed.length > 0 ? totalHours / completed.length : 0
  const maxShifts       = Math.max(...monthlyData.map(([, v]) => v.shifts), 1)
  const roleDistrib     = { NURSE: shifts.filter(s => s.role === 'NURSE').length, EN: shifts.filter(s => s.role === 'EN').length, PCA: shifts.filter(s => s.role === 'PCA').length }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fill Rate',          value: `${fillRate}%`,                                   sub: 'of shifts covered',           bar: fillRate },
          { label: 'Care Hours Delivered', value: `${Math.round(totalHours)}h`,                   sub: 'total hours of care',         bar: null },
          { label: 'Avg Shift Length',   value: `${avgHours.toFixed(1)}h`,                        sub: 'average duration',            bar: null },
          { label: 'Active Carers',      value: String(workers.filter(w=>w.isActive).length),     sub: 'across all care homes',       bar: null },
        ].map(kpi => (
          <Card key={kpi.label} className="hover:shadow-card-hover transition-shadow duration-300">
            <CardContent className="p-5">
              <p className="text-label text-ink/40 mb-2">{kpi.label}</p>
              <p className="text-3xl font-black font-mono text-ink animate-count-up">{kpi.value}</p>
              <p className="text-xs text-ink/40 mt-1">{kpi.sub}</p>
              {kpi.bar !== null && (
                <div className="mt-3 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-electric rounded-full transition-all duration-700" style={{ width: `${kpi.bar}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shifts chart */}
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-teal" /> Monthly Shifts Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {monthlyData.length === 0 ? (
              <p className="text-ink/40 text-center py-8 text-sm">No completed shifts yet.</p>
            ) : (
              <div className="flex items-end gap-2 h-36">
                {monthlyData.map(([month, v]) => {
                  const pct = (v.shifts / maxShifts) * 100
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <p className="text-[9px] text-teal font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {v.shifts} shifts
                      </p>
                      <div
                        className="w-full rounded-t-lg bg-gradient-electric opacity-80 group-hover:opacity-100 transition-all duration-300"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                      <p className="text-[9px] text-ink/35 font-medium">{month.split(' ')[0]}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role distribution */}
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-violet-500" /> Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {([['NURSE', 'bg-sky-500', 'text-sky-600', 'Registered Nurses'], ['EN', 'bg-violet-500', 'text-violet-600', 'Enrolled Nurses'], ['PCA', 'bg-amber-500', 'text-amber-600', 'Personal Care Assistants']] as const).map(([role, bar, txt, label]) => {
              const count = roleDistrib[role as keyof typeof roleDistrib]
              const pct   = shifts.length > 0 ? (count / shifts.length) * 100 : 0
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-ink">{label}</span>
                    <span className={`font-mono font-bold text-xs ${txt}`}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-amber-500" /> Shift Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {[
              { label: 'Awaiting Staff',   status: 'PENDING',    bar: 'bg-amber-400' },
              { label: 'Confirmed',        status: 'MATCHED',    bar: 'bg-emerald-500' },
              { label: 'On Shift',         status: 'CLOCKED_IN', bar: 'bg-blue-500' },
              { label: 'Completed',        status: 'COMPLETED',  bar: 'bg-emerald-500' },
              { label: 'Cancelled',        status: 'CANCELLED',  bar: 'bg-stone-300' },
            ].map(({ label, status, bar }) => {
              const count = shifts.filter(s => s.status === status).length
              const pct   = shifts.length > 0 ? (count / shifts.length) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-medium text-ink text-sm">{label}</span>
                    <span className="font-mono font-bold text-xs text-ink/50">{count}</span>
                  </div>
                  <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Top rated workers */}
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Highly Rated Carers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {workers.filter(w => w.rating).length === 0 ? (
              <p className="text-ink/40 text-center py-8 text-sm">No ratings yet.</p>
            ) : (
              <div className="divide-y divide-surface-2">
                {workers.filter(w => w.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5).map((w, i) => (
                  <div key={w.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors">
                    <span className="text-lg font-black font-mono text-ink/20 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm truncate">{w.name ?? w.email}</p>
                      <p className="text-xs text-ink/40">{w.role}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-black font-mono text-sm text-ink">{w.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { broadcast?: string; tab?: string; error?: string }
}) {
  const admin = await requireAdmin()
  if (!admin) redirect('/login?error=Unauthorized')

  const data          = await getDashboardData()
  const showBroadcast = searchParams.broadcast === '1'
  const broadcastError = searchParams.error
  const activeTab     = searchParams.tab ?? 'overview'

  const tabs = [
    { id: 'overview',   label: 'Overview',              icon: LayoutDashboard, badge: 0 },
    { id: 'compliance', label: 'Certifications',        icon: FileWarning,     badge: data.pendingDocs.length },
    { id: 'workforce',  label: 'Care Team',             icon: Users,           badge: 0 },
    { id: 'facilities', label: 'Care Homes',            icon: Building2,       badge: 0 },
    { id: 'analytics',  label: 'Insights',              icon: TrendingUp,      badge: 0 },
  ]

  return (
    <div className="flex min-h-screen bg-surface-1">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-60 bg-ink hidden md:flex flex-col shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />

        <div className="relative flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-electric flex items-center justify-center shadow-btn shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight tracking-tight">Carelink</p>
              <p className="text-white/30 text-[10px] font-medium">Operations</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 flex-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <a
                  key={tab.id}
                  href={tab.id === 'overview' ? '/dashboard' : `/dashboard?tab=${tab.id}`}
                  className={[
                    'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-150 relative',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/5',
                  ].join(' ')}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal rounded-r-full" style={{ boxShadow: '0 0 8px rgba(217,119,6,0.8)' }} />
                  )}
                  <tab.icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-teal' : 'text-white/30 group-hover:text-white/60'}`} />
                  <span className="flex-1">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center leading-none shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </a>
              )
            })}
          </nav>

          <div className="border-t border-white/5 pt-4 mt-4">
            <form action={signOut}>
              <button type="submit" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/30 hover:text-rose-400 hover:bg-white/5 transition-all duration-150 text-sm font-medium text-left">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-surface-2 px-8 py-4 flex justify-between items-center">
          <div>
            <p className="text-label text-ink/40">{tabs.find(t => t.id === activeTab)?.label}</p>
            <h2 className="text-2xl font-black tracking-tight text-ink leading-tight">Care Operations</h2>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell tone="light" />
            <a href="/dashboard?broadcast=1">
              <Button className="gap-2 shadow-btn">
                <Zap className="w-4 h-4" /> Post a Shift
              </Button>
            </a>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {[
              { label: 'Total Shifts',   value: data.shifts.length,         sub: 'All time',               icon: Clock,        accent: 'text-ink' },
              { label: 'Active Now',     value: data.activeShifts.length,   sub: 'Confirmed + on shift',   icon: Activity,     accent: 'text-teal' },
              { label: 'Awaiting Staff', value: data.unfilledShifts.length, sub: 'Need a carer assigned',  icon: FileWarning,  accent: 'text-amber-600' },
              { label: 'Care Team',      value: data.workers.length,        sub: `${data.facilities.length} care homes`, icon: Users, accent: 'text-ink' },
            ].map(kpi => (
              <Card key={kpi.label} className="hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-label text-ink/40">{kpi.label}</p>
                    <kpi.icon className={`w-4 h-4 ${kpi.accent} opacity-60`} />
                  </div>
                  <p className={`text-3xl font-black font-mono ${kpi.accent}`}>{kpi.value}</p>
                  <p className="text-xs text-ink/35 mt-1 font-medium">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview'   && <OverviewTab data={data} />}
          {activeTab === 'compliance' && <ComplianceTab data={data} />}
          {activeTab === 'workforce'  && <WorkforceTab data={data} />}
          {activeTab === 'facilities' && <FacilitiesTab data={data} />}
          {activeTab === 'analytics'  && <AnalyticsTab data={data} />}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-light border-t border-surface-2 z-40">
        <div className="flex justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.slice(0, 5).map(tab => {
            const isActive = activeTab === tab.id
            return (
              <a
                key={tab.id}
                href={tab.id === 'overview' ? '/dashboard' : `/dashboard?tab=${tab.id}`}
                className={`relative flex flex-col items-center gap-0.5 transition-colors ${isActive ? 'text-teal' : 'text-ink/35'}`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-teal/10' : ''}`}>
                  <tab.icon className="w-[18px] h-[18px]" />
                  {tab.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </div>
                <span className="text-[9px] font-semibold leading-none">{tab.label}</span>
              </a>
            )
          })}
        </div>
      </nav>

      {/* ── Post Shift Modal ─────────────────────────────────────────── */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-md relative animate-scale-in">
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-surface-2">
              <div>
                <h3 className="text-xl font-black tracking-tight text-ink">Post a Shift</h3>
                <p className="text-sm text-ink/40 mt-0.5">We'll match you with a verified carer</p>
              </div>
              <a href="/dashboard" className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors">
                <X className="w-4 h-4 text-ink/50" />
              </a>
            </div>

            <form action={broadcastShift} className="p-7 space-y-4">
              {broadcastError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{decodeURIComponent(broadcastError)}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Care Home</label>
                <select name="facilityId" className="w-full h-11 rounded-xl border border-surface-3 bg-white px-4 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required>
                  <option value="">Select a care home…</option>
                  {data.facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Role Required</label>
                <select name="role" className="w-full h-11 rounded-xl border border-surface-3 bg-white px-4 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required>
                  <option value="NURSE">Registered Nurse (RN)</option>
                  <option value="EN">Enrolled Nurse (EN)</option>
                  <option value="PCA">Personal Care Assistant</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['startTime', 'endTime'].map((name, i) => (
                  <div key={name} className="space-y-1.5">
                    <label className="text-label text-ink/50">{i === 0 ? 'Start' : 'End'}</label>
                    <input type="datetime-local" name={name} className="w-full h-11 rounded-xl border border-surface-3 bg-white px-3 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Hourly Rate</label>
                <input type="number" name="hourlyRate" step="0.01" min="0" className="w-full h-11 rounded-xl border border-surface-3 bg-white px-4 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required placeholder="Enter rate…" />
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Notes (optional)</label>
                <textarea name="notes" rows={2} maxLength={500} className="w-full rounded-xl border border-surface-3 bg-white px-4 py-3 text-sm text-ink resize-none focus:outline-none focus:border-teal focus:shadow-focus transition-all" placeholder="Any special requirements for this shift…" />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input type="checkbox" name="urgent" className="w-4 h-4 rounded accent-rose-500" />
                <span className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Mark as Urgent
                </span>
              </label>

              <div className="flex gap-3 pt-1">
                <a href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">Cancel</Button>
                </a>
                <Button type="submit" className="flex-1 gap-2">
                  Post Shift
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
