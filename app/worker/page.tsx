import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Stethoscope, CalendarCheck, Wallet, UserCircle,
  Clock, AlertTriangle, MapPin, ArrowRight,
  Zap, ShieldCheck, Heart,
} from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { AcceptShiftSchema } from '@/lib/validations'
import { notifyFacilityShiftFilled, notifyShiftAccepted } from '@/lib/notifications'
import { getComplianceStatusForDocuments } from '@/lib/compliance'
import { hasAvailability, isShiftAllowedByAvailability } from '@/lib/availability'
import { calculateShiftPay } from '@/lib/pay-engine'

export const dynamic = 'force-dynamic'

const ROLE_GRADIENT: Record<string, string> = {
  NURSE: 'from-sky-500 to-blue-600',
  EN:    'from-violet-500 to-purple-700',
  PCA:   'from-amber-500 to-amber-700',
}
const ROLE_BG: Record<string, string> = {
  NURSE: 'bg-sky-50   text-sky-700   border-sky-200',
  EN:    'bg-violet-50 text-violet-700 border-violet-200',
  PCA:   'bg-amber-50  text-amber-700  border-amber-200',
}
const WORKER_ROLES = ['NURSE', 'EN', 'PCA'] as const

function melbourneDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Australia/Melbourne',
  }).formatToParts(date)
  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

async function getWorkerData() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const [availableShifts, myActiveShifts, unreadCount, documents] = await Promise.all([
    prisma.shift.findMany({
      where: { status: 'PENDING', workerId: null },
      include: { facility: { select: { id: true, name: true, address: true } } },
      orderBy: [{ urgent: 'desc' }, { startTime: 'asc' }],
    }),
    prisma.shift.count({
      where: { workerId: user.id, status: { in: ['MATCHED', 'CLOCKED_IN'] } },
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.complianceDocument.findMany({ where: { userId: user.id } }),
  ])

  const effectiveComplianceStatus = getComplianceStatusForDocuments(dbUser.role, documents)
  const effectiveUser = effectiveComplianceStatus === dbUser.complianceStatus
    ? dbUser
    : await prisma.user.update({
        where: { id: dbUser.id },
        data: { complianceStatus: effectiveComplianceStatus },
      })

  return { user: effectiveUser, availableShifts, myActiveShifts, unreadCount }
}

export default async function WorkerPortal({
  searchParams,
}: {
  searchParams: { error?: string; filter?: string; role?: string; date?: string; confirm?: string }
}) {
  const { user, availableShifts, myActiveShifts } = await getWorkerData()
  const errorMessage = searchParams.error
  const filter = searchParams.filter ?? 'all'
  const roleFilter = searchParams.role === 'ALL' || WORKER_ROLES.includes(searchParams.role as never)
    ? searchParams.role!
    : user.role
  const dateFilter = searchParams.date ?? ''
  const availabilityActive = hasAvailability(user.availability)
  const availabilityMatchedShifts = availableShifts.filter(s =>
    isShiftAllowedByAvailability(user.availability, s.startTime),
  )

  const urgentCount = availabilityMatchedShifts.filter(s => s.urgent).length
  const filteredShifts = availabilityMatchedShifts.filter(s => {
    if (filter === 'urgent' && !s.urgent) return false
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false
    if (dateFilter && melbourneDateKey(s.startTime) !== dateFilter) return false
    return true
  })
  const confirmShift = searchParams.confirm
    ? availabilityMatchedShifts.find(s => s.id === searchParams.confirm)
    : null
  const confirmShiftPay = confirmShift ? calculateShiftPay(confirmShift) : null
  const isCompliant = user.complianceStatus === 'GREEN'

  function feedHref(next: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    params.set('filter', next.filter ?? filter)
    params.set('role', next.role ?? roleFilter)
    if (next.date ?? dateFilter) params.set('date', next.date ?? dateFilter)
    if (next.confirm) params.set('confirm', next.confirm)
    return `/worker?${params.toString()}`
  }

  async function acceptShift(formData: FormData) {
    'use server'
    const parsed = AcceptShiftSchema.safeParse({ shiftId: formData.get('shiftId') })
    if (!parsed.success) redirect('/worker?error=Invalid+shift')

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({ where: { id: authUser.id } })
      if (!dbUser) return { error: 'user_not_found' as const }
      const documents = await tx.complianceDocument.findMany({ where: { userId: authUser.id } })
      const complianceStatus = getComplianceStatusForDocuments(dbUser.role, documents)
      if (complianceStatus !== dbUser.complianceStatus) {
        await tx.user.update({ where: { id: dbUser.id }, data: { complianceStatus } })
      }
      if (complianceStatus !== 'GREEN') return { error: 'compliance_required' as const }

      const shift = await tx.shift.findUnique({
        where: { id: parsed.data.shiftId },
        include: { facility: { select: { id: true, name: true } } },
      })
      if (!shift || shift.status !== 'PENDING' || shift.workerId !== null)
        return { error: 'shift_already_taken' as const }
      if (dbUser.role !== shift.role) return { error: 'role_mismatch' as const }
      if (!isShiftAllowedByAvailability(dbUser.availability, shift.startTime)) {
        return { error: 'availability_mismatch' as const }
      }

      const updated = await tx.shift.updateMany({
        where: { id: parsed.data.shiftId, workerId: null, status: 'PENDING' },
        data: { workerId: dbUser.id, status: 'MATCHED' },
      })
      if (updated.count === 0) return { error: 'shift_already_taken' as const }

      return {
        ok: true as const,
        facilityId: shift.facility.id,
        facilityName: shift.facility.name,
        role: shift.role,
        workerName: dbUser.name ?? dbUser.email,
        dbUser,
      }
    })

    if ('error' in result) redirect('/worker?error=' + result.error)

    await Promise.all([
      notifyShiftAccepted(result.dbUser.id, result.facilityName, parsed.data.shiftId),
      notifyFacilityShiftFilled(result.facilityId, result.workerName, result.role, parsed.data.shiftId),
    ])
    revalidatePath('/worker')
    revalidatePath('/worker/my-shifts')
    revalidatePath('/dashboard')
    revalidatePath('/facility')
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />

        <div className="relative px-5 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal/80 text-xs font-semibold tracking-widest uppercase mb-0.5">Welcome back</p>
              <h1 className="text-2xl font-black tracking-tight text-white">{user.name ?? 'Carer'}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <LogoutButton />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              {
                label: 'Status',
                value: isCompliant ? 'Ready to Work' : 'Set Up Profile',
                dot: isCompliant ? 'bg-emerald-400' : 'bg-rose-400',
                pulse: !isCompliant,
              },
              { label: 'Active', value: `${myActiveShifts} shifts`, dot: null, pulse: false },
              { label: 'Role', value: user.role, dot: null, pulse: false },
            ].map(item => (
              <div key={item.label} className="glass rounded-xl p-3">
                <p className="text-white/45 text-[10px] font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                <div className="flex items-center gap-1.5">
                  {item.dot && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot} ${item.pulse ? 'animate-pulse' : ''}`} />
                  )}
                  <span className="text-white text-sm font-bold">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Feed ──────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-5 pb-28 space-y-4 overflow-y-auto">

        {/* Profile completion banner */}
        {!isCompliant && (
          <a href="/worker/profile" className="block animate-fade-in-up">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 text-sm">A few things to complete before your first shift</p>
                <p className="text-amber-700 text-xs mt-0.5">Upload your certifications to get started — it only takes a minute.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform mt-0.5" />
            </div>
          </a>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-fade-in flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMessage === 'compliance_required' ? 'Please complete your profile before accepting shifts.' :
             errorMessage === 'shift_already_taken' ? 'That shift was just taken by another carer. Keep an eye out for new ones!' :
             errorMessage === 'availability_mismatch' ? 'That shift falls outside your saved availability.' :
             decodeURIComponent(errorMessage)}
          </div>
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all',    label: `All shifts`, count: availabilityMatchedShifts.length },
            { id: 'urgent', label: 'Urgent',     count: urgentCount },
          ].map(f => (
            <a
              key={f.id}
              href={`/worker?filter=${f.id}`}
              className={[
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150',
                filter === f.id
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-ink/50 border border-surface-3 hover:border-ink/20 hover:text-ink/70',
              ].join(' ')}
            >
              {f.id === 'urgent' && <Zap className="w-3 h-3" />}
              {f.label}
              <span className={`ml-0.5 ${filter === f.id ? 'text-white/60' : 'text-ink/35'}`}>
                {f.count}
              </span>
            </a>
          ))}
          {availabilityActive && (
            <a
              href="/worker/profile"
              className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal/10 text-teal border border-teal/20"
            >
              <Clock className="w-3 h-3" />
              Availability active
            </a>
          )}
        </div>

        {/* Search filters */}
        <form action="/worker" className="bg-white rounded-2xl border border-surface-3 shadow-card p-3 grid grid-cols-2 gap-3">
          <input type="hidden" name="filter" value={filter} />
          <div>
            <label className="block text-[10px] font-bold text-ink/35 uppercase tracking-wider mb-1">Role</label>
            <select name="role" defaultValue={roleFilter} className="h-10 w-full rounded-xl border border-surface-3 bg-surface-1 px-3 text-xs font-semibold text-ink focus:outline-none focus:border-teal">
              <option value="ALL">All roles</option>
              <option value="NURSE">Registered Nurse</option>
              <option value="EN">Enrolled Nurse</option>
              <option value="PCA">Personal Care Asst.</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-ink/35 uppercase tracking-wider mb-1">Date</label>
            <input name="date" type="date" defaultValue={dateFilter} className="h-10 w-full rounded-xl border border-surface-3 bg-surface-1 px-3 text-xs font-semibold text-ink focus:outline-none focus:border-teal" />
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <Button type="submit" className="h-10 flex-1 text-xs font-bold">Apply</Button>
            <a href="/worker" className="h-10 px-3 rounded-xl border border-surface-3 bg-white text-xs font-bold text-ink/50 flex items-center justify-center">Reset</a>
          </div>
        </form>

        {/* Section heading */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink text-base tracking-tight">Shifts Matching Your Profile</h2>
          {filteredShifts.length > 0 && (
            <p className="text-xs text-ink/40 font-medium">{filteredShifts.length} open</p>
          )}
        </div>

        {/* Shifts */}
        {filteredShifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-surface-3 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
              <CalendarCheck className="w-7 h-7 text-ink/25" />
            </div>
            <p className="font-bold text-ink text-sm">You&apos;re all caught up</p>
            <p className="text-ink/40 text-xs mt-1 text-center px-8">
              New shifts will appear here as they become available.
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filteredShifts.map(shift => {
              const pay = calculateShiftPay(shift)
              const gradient = ROLE_GRADIENT[shift.role] ?? 'from-amber-500 to-amber-700'
              const roleBadge = ROLE_BG[shift.role] ?? 'bg-amber-50 text-amber-700 border-amber-200'

              return (
                <div
                  key={shift.id}
                  className={[
                    'bg-white rounded-2xl border overflow-hidden',
                    'shadow-card transition-all duration-[220ms] ease-spring',
                    'hover:shadow-card-hover hover:-translate-y-0.5',
                    shift.urgent ? 'border-rose-200' : 'border-surface-3',
                  ].join(' ')}
                >
                  <div className={`h-1.5 w-full bg-gradient-to-r ${shift.urgent ? 'from-rose-500 to-rose-600' : gradient}`} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-bold text-ink text-base leading-tight truncate">{shift.facility.name}</p>
                        {shift.urgent && (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            <Zap className="w-2.5 h-2.5" /> URGENT
                          </span>
                        )}
                      </div>
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Award wages
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border mb-3 ${roleBadge}`}>
                      {shift.role === 'NURSE' ? 'Registered Nurse' : shift.role === 'EN' ? 'Enrolled Nurse' : 'Personal Care Asst.'}
                    </span>

                    <div className="space-y-1.5 text-sm text-ink/60">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                        <span className="font-medium">
                          {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                          <span className="text-ink/35 mx-1.5">·</span>
                          {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' – '}
                          {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          <span className="text-ink/35 ml-1.5">({pay.hours.toFixed(1)}h)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                        <span className="truncate">{shift.facility.address}</span>
                      </div>
                    </div>

                    {shift.notes && (
                      <p className="mt-2.5 text-xs text-ink/45 italic bg-surface-1 rounded-xl px-3 py-2 border border-surface-3">
                        {shift.notes}
                      </p>
                    )}

                    <div className="mt-4">
                      {isCompliant ? (
                        <Button
                          asChild
                          className={`w-full h-12 text-base font-bold rounded-xl gap-2 ${
                            shift.urgent
                              ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-glow-rose hover:shadow-glow-rose'
                              : ''
                          }`}
                        >
                          <a href={feedHref({ confirm: shift.id })}><span>Accept This Shift</span><ArrowRight className="w-4 h-4" /></a>
                        </Button>
                      ) : (
                        <Button type="button" className="w-full h-12 text-base font-bold rounded-xl" disabled>
                          Complete Your Profile First
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Confirm Modal ───────────────────────────────────────────────── */}
      {confirmShift && (
        <div className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-5">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-modal border border-surface-2 overflow-hidden animate-fade-in-up">
            <div className={`h-1.5 bg-gradient-to-r ${confirmShift.urgent ? 'from-rose-500 to-rose-600' : ROLE_GRADIENT[confirmShift.role] ?? 'from-amber-500 to-amber-700'}`} />
            <div className="p-5 space-y-4">
              <div>
                <p className="text-label text-ink/40 mb-1">Confirm shift</p>
                <h2 className="text-xl font-black text-ink">{confirmShift.facility.name}</h2>
                <p className="text-sm text-ink/45 mt-1">{confirmShift.facility.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-1 border border-surface-2 p-3">
                  <p className="text-[10px] font-bold text-ink/35 uppercase tracking-wider">Role</p>
                  <p className="font-black text-ink mt-1">
                    {confirmShift.role === 'NURSE' ? 'Registered Nurse' : confirmShift.role === 'EN' ? 'Enrolled Nurse' : 'Personal Care Asst.'}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-1 border border-surface-2 p-3">
                  <p className="text-[10px] font-bold text-ink/35 uppercase tracking-wider">Duration</p>
                  <p className="font-black text-ink mt-1">{confirmShiftPay?.hours.toFixed(1)}h</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Pay guarantee</p>
                    <p className="font-bold text-emerald-800 text-sm mt-0.5">Award wages paid for this shift</p>
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl bg-surface-1 border border-surface-2 p-3">
                  <p className="text-[10px] font-bold text-ink/35 uppercase tracking-wider">Time</p>
                  <p className="font-bold text-ink mt-1">
                    {confirmShift.startTime.toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                    {' · '}
                    {confirmShift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                    {' – '}
                    {confirmShift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                  </p>
                </div>
              </div>
              {confirmShift.notes && (
                <p className="text-sm text-ink/55 bg-amber-50 border border-amber-100 rounded-2xl p-3">{confirmShift.notes}</p>
              )}
              <div className="flex gap-3 pt-1">
                <a href={feedHref({ confirm: undefined })} className="h-12 flex-1 rounded-xl border border-surface-3 text-ink/55 font-bold flex items-center justify-center">
                  Go Back
                </a>
                <form action={acceptShift} className="flex-1">
                  <input type="hidden" name="shiftId" value={confirmShift.id} />
                  <Button type="submit" className="w-full h-12 font-black">Confirm Shift</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Navigation ───────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl glass-light border-t border-surface-3 flex justify-around pb-safe">
        {[
          { href: '/worker',           icon: CalendarCheck, label: 'Shifts',    active: true  },
          { href: '/worker/my-shifts', icon: Clock,         label: 'My Shifts', active: false },
          { href: '/worker/pay',       icon: Wallet,        label: 'Pay',       active: false },
          { href: '/worker/profile',   icon: UserCircle,    label: 'Profile',   active: false },
        ].map(item => (
          <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-3 px-4 min-w-[60px] group">
            <div className={`p-1.5 rounded-xl transition-all duration-150 ${item.active ? 'bg-teal/10' : 'group-hover:bg-surface-2'}`}>
              <item.icon className={`w-5 h-5 transition-colors duration-150 ${item.active ? 'text-teal' : 'text-ink/35 group-hover:text-ink/60'}`} />
            </div>
            <span className={`text-[10px] font-semibold transition-colors duration-150 ${item.active ? 'text-teal' : 'text-ink/35 group-hover:text-ink/60'}`}>
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  )
}
