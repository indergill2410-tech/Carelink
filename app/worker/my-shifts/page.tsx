import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import {
  CalendarCheck, Clock, Wallet, UserCircle,
  MapPin, LogIn, LogOut, Star, Zap, AlertTriangle,
  FileCheck,
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { notifyFacilityShiftCancelledByWorker } from '@/lib/notifications'
import { calculateShiftPay } from '@/lib/pay-engine'

export const dynamic = 'force-dynamic'

const ROLE_BAR: Record<string, string> = {
  NURSE: 'bg-gradient-to-r from-sky-400 to-sky-600',
  EN:    'bg-gradient-to-r from-violet-500 to-purple-600',
  PCA:   'bg-gradient-to-r from-teal to-electric-dim',
}

const STATUS_BAR: Record<string, string> = {
  MATCHED:    'bg-gradient-to-r from-amber-400 to-orange-400',
  CLOCKED_IN: 'bg-gradient-to-r from-blue-500 to-sky-500',
  COMPLETED:  'bg-gradient-to-r from-emerald-500 to-teal',
  CANCELLED:  'bg-surface-3',
}

export default async function MyShiftsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string }
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const shifts = await prisma.shift.findMany({
    where: { workerId: user.id },
    include: {
      facility: { select: { id: true, name: true, address: true } },
      ratings: { where: { raterId: user.id } },
      timesheet: { select: { status: true } },
    },
    orderBy: { startTime: 'desc' },
  })

  const now = new Date()
  const upcoming = shifts.filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status) && s.endTime >= now)
  const overdue  = shifts.filter(s => s.status === 'MATCHED' && s.endTime < now)
  const past     = shifts.filter(s => ['COMPLETED', 'CANCELLED'].includes(s.status))

  async function clockIn(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift || shift.workerId !== authUser.id || shift.status !== 'MATCHED') return

    // Enforce: can only clock in within 30 minutes of shift start (or after)
    const now = new Date()
    const earliestClockIn = new Date(shift.startTime.getTime() - 30 * 60 * 1000)
    if (now < earliestClockIn) return

    await prisma.$transaction(async tx => {
      await tx.shift.update({
        where: { id: shiftId },
        data: { status: 'CLOCKED_IN', clockInAt: now },
      })
      await tx.timesheet.upsert({
        where: { shiftId },
        create: { shiftId, clockIn: now, status: 'PENDING_APPROVAL' },
        update: { clockIn: now, clockOut: null, status: 'PENDING_APPROVAL' },
      })
    })
    revalidatePath('/worker/my-shifts')
    revalidatePath('/facility')
  }

  async function clockOut(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')
    try {
      const now = new Date()
      await prisma.$transaction(async tx => {
        const result = await tx.shift.updateMany({
          where: { id: shiftId, workerId: authUser.id, status: 'CLOCKED_IN' },
          data: { status: 'COMPLETED', clockOutAt: now },
        })
        if (result.count === 0) return
        await tx.timesheet.upsert({
          where: { shiftId },
          create: { shiftId, clockOut: now, status: 'PENDING_APPROVAL' },
          update: { clockOut: now, status: 'PENDING_APPROVAL' },
        })
      })
    } catch (err) {
      console.error('[clockOut] Prisma error:', err)
      return
    }
    revalidatePath('/worker/my-shifts')
    revalidatePath('/worker/pay')
    revalidatePath('/facility')
    revalidatePath('/dashboard')
  }

  async function cancelShift(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')
    try {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId, workerId: authUser.id, status: 'MATCHED' },
        include: {
          facility: { select: { id: true, name: true } },
          worker: { select: { name: true, email: true } },
        },
      })
      if (!shift) return

      const result = await prisma.shift.updateMany({
        where: { id: shiftId, workerId: authUser.id, status: 'MATCHED' },
        data: { status: 'PENDING', workerId: null, clockInAt: null, clockOutAt: null },
      })
      if (result.count === 0) return

      await notifyFacilityShiftCancelledByWorker(
        shift.facility.id,
        shift.worker?.name ?? shift.worker?.email ?? 'A worker',
        shift.role,
        shift.id,
      )
    } catch (err) {
      console.error('[cancelShift] Prisma error:', err)
      return
    }
    revalidatePath('/worker/my-shifts')
    revalidatePath('/worker')
    revalidatePath('/facility')
    revalidatePath('/dashboard')
  }

  async function rateShift(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    const rating  = parseInt(formData.get('rating') as string, 10)
    const comment = (formData.get('comment') as string) || null
    if (!shiftId || !rating || rating < 1 || rating > 5) return
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')
    const shift = await prisma.shift.findFirst({ where: { id: shiftId, workerId: authUser.id, status: 'COMPLETED' } })
    if (!shift) return
    // rateeId must be a User ID — find the facility's admin manager
    let facilityAdmin = await prisma.user.findFirst({
      where: { facilityId: shift.facilityId, role: 'FACILITY_ADMIN', isActive: true },
      select: { id: true },
    })
    if (!facilityAdmin) {
      facilityAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      })
    }
    if (!facilityAdmin) redirect('/worker/my-shifts?error=' + encodeURIComponent('Could not submit rating — facility administrator not found.'))
    await prisma.shiftRating.upsert({
      where: { shiftId_raterId: { shiftId, raterId: authUser.id } },
      create: { shiftId, raterId: authUser.id, rateeId: facilityAdmin.id, rating, comment },
      update: { rating, comment },
    })
    revalidatePath('/worker/my-shifts')
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })
  }
  function formatDate(d: Date) {
    return d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })
  }

  type ShiftWithIncludes = typeof shifts[number]

  function ShiftCard({ shift, section }: { shift: ShiftWithIncludes; section: 'upcoming' | 'overdue' | 'past' }) {
    const pay         = calculateShiftPay(shift)
    const hasRated    = shift.ratings.length > 0
    const isClockedIn = shift.status === 'CLOCKED_IN'
    const isCompleted = shift.status === 'COMPLETED'
    const isCancelled = shift.status === 'CANCELLED'
    const canClockIn  = shift.status === 'MATCHED' && shift.startTime <= new Date(Date.now() + 30 * 60 * 1000)
    const barClass    = section === 'overdue'
      ? 'bg-gradient-to-r from-rose-500 to-red-500'
      : STATUS_BAR[shift.status] ?? ROLE_BAR[shift.role] ?? 'bg-surface-3'

    return (
      <div className={`bg-white rounded-2xl border shadow-card overflow-hidden transition-all duration-[220ms] ease-spring ${
        isCancelled ? 'border-surface-2 opacity-60' : 'border-surface-2 hover:shadow-card-hover'
      }`}>
        {/* Status gradient bar */}
        <div className={`h-1 ${barClass}`} />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink text-sm leading-tight truncate">{shift.facility.name}</p>
              <p className="text-xs text-ink/45 mt-0.5">{shift.facility.address}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {shift.urgent && !isCancelled && (
                <span className="flex items-center gap-0.5 bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" /> URGENT
                </span>
              )}
              <StatusBadge status={isCancelled ? 'CANCELLED' : shift.status} />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-ink/60">
              <Clock className="w-3.5 h-3.5 shrink-0 text-ink/30" />
              <span>{formatDate(shift.startTime)} · {formatTime(shift.startTime)} – {formatTime(shift.endTime)}</span>
              <span className="font-mono text-ink/40 ml-auto">{pay.hours.toFixed(1)}h</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink/60">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-ink/30" />
              <span className="truncate flex-1">{shift.facility.address}</span>
              <span className="font-mono font-bold text-ink/70 shrink-0">${pay.total.toFixed(0)}</span>
            </div>
            {pay.extras > 0 && (
              <div className="flex items-center gap-2 text-xs text-teal font-semibold">
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                +${pay.extras.toFixed(0)} loadings and ERTC incentives
              </div>
            )}
            {isClockedIn && shift.clockInAt && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                On duty since {formatTime(shift.clockInAt)}
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 text-xs text-ink/40 font-semibold uppercase tracking-wider">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                {shift.timesheet?.status ? shift.timesheet.status.replace(/_/g, ' ') : 'Pending approval'}
              </div>
            )}
          </div>

          {/* Actions */}
          {(isClockedIn || canClockIn || (section === 'overdue' && shift.status === 'MATCHED') || (shift.status === 'MATCHED' && !canClockIn) || (isCompleted && !hasRated)) && (
            <div className="mt-4 space-y-2">
              {isClockedIn && (
                <form action={clockOut}>
                  <input type="hidden" name="shiftId" value={shift.id} />
                  <Button type="submit" className="w-full h-12 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal hover:from-emerald-600 hover:to-teal shadow-btn gap-2">
                    <LogOut className="w-4 h-4" /> Clock Out
                  </Button>
                </form>
              )}
              {(canClockIn || section === 'overdue') && shift.status === 'MATCHED' && (
                <form action={clockIn}>
                  <input type="hidden" name="shiftId" value={shift.id} />
                  <Button type="submit" className="w-full h-12 text-sm font-bold gap-2 ring-2 ring-teal/30">
                    <LogIn className="w-4 h-4" /> Clock In Now
                  </Button>
                </form>
              )}
              {shift.status === 'MATCHED' && !canClockIn && section !== 'overdue' && (
                <form action={cancelShift}>
                  <input type="hidden" name="shiftId" value={shift.id} />
                  <Button type="submit" variant="outline" className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold">
                    Cancel Shift
                  </Button>
                </form>
              )}
              {isCompleted && !hasRated && (
                <details className="group">
                  <summary className="flex items-center gap-1.5 text-sm text-teal cursor-pointer font-semibold list-none">
                    <Star className="w-3.5 h-3.5" /> Rate this shift
                    <span className="ml-auto text-xs text-ink/30 group-open:hidden">▸</span>
                  </summary>
                  <form action={rateShift} className="mt-3 space-y-3 pt-3 border-t border-surface-2">
                    <input type="hidden" name="shiftId" value={shift.id} />
                    <div className="flex gap-1.5 justify-center">
                      {[1, 2, 3, 4, 5].map(n => (
                        <label key={n} className="cursor-pointer">
                          <input type="radio" name="rating" value={n} className="sr-only" required />
                          <span className="text-2xl hover:scale-125 transition-transform block select-none">⭐</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      name="comment"
                      rows={2}
                      placeholder="Optional comment…"
                      maxLength={500}
                      className="w-full rounded-xl border border-surface-3 bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-teal focus:shadow-focus focus:outline-none resize-none"
                    />
                    <Button type="submit" size="sm" className="w-full h-9">Submit Rating</Button>
                  </form>
                </details>
              )}
              {isCompleted && hasRated && (
                <p className="text-xs text-ink/35 text-center flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Rated {shift.ratings[0].rating}/5
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const NAV = [
    { href: '/worker',          icon: CalendarCheck, label: 'Feed',      active: false },
    { href: '/worker/my-shifts', icon: Clock,         label: 'My Shifts', active: true  },
    { href: '/worker/pay',       icon: Wallet,        label: 'Pay',       active: false },
    { href: '/worker/profile',   icon: UserCircle,    label: 'Profile',   active: false },
  ]

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto relative">

      {/* Header */}
      <header className="relative overflow-hidden bg-ink px-6 pt-6 pb-7">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal/80 uppercase tracking-widest mb-0.5">My Shifts</p>
            <h1 className="font-black text-white text-xl tracking-tight">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>
        {/* Summary pills */}
        <div className="relative flex gap-2 mt-4">
          {upcoming.length > 0 && (
            <div className="glass px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-white/80 text-xs font-semibold">{upcoming.length} upcoming</span>
            </div>
          )}
          {overdue.length > 0 && (
            <div className="bg-rose-500/20 border border-rose-500/25 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-rose-300" />
              <span className="text-rose-300 text-xs font-semibold">{overdue.length} need attention</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 space-y-6">
        {searchParams.error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {decodeURIComponent(searchParams.error)}
          </div>
        )}
        {searchParams.success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            {decodeURIComponent(searchParams.success)}
          </div>
        )}

        {/* Needs Attention */}
        {overdue.length > 0 && (
          <section>
            <h2 className="font-bold text-rose-600 mb-3 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Needs Attention
            </h2>
            <div className="space-y-3 stagger-children">
              {overdue.map(s => <ShiftCard key={s.id} shift={s} section="overdue" />)}
            </div>
          </section>
        )}

        {/* Upcoming */}
        <section>
          <h2 className="font-bold text-ink mb-3 text-sm uppercase tracking-wider">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-surface-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-ink/30" />
              </div>
              <p className="text-ink/50 text-sm font-medium">No upcoming shifts</p>
              <p className="text-ink/30 text-xs mt-1">Browse the feed to accept one</p>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {upcoming.map(s => <ShiftCard key={s.id} shift={s} section="upcoming" />)}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="font-bold text-ink mb-3 text-sm uppercase tracking-wider">Past Shifts</h2>
          {past.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-surface-3">
              <p className="text-ink/40 text-sm">No past shifts yet</p>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {past.map(s => <ShiftCard key={s.id} shift={s} section="past" />)}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-50">
        <div className="glass-light border-t border-surface-2 flex justify-around px-2 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {NAV.map(item => (
            <a key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 transition-colors ${item.active ? 'text-teal' : 'text-ink/35 hover:text-ink/60'}`}>
              <div className={`p-2 rounded-xl transition-colors ${item.active ? 'bg-teal/10' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
