import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Stethoscope, CalendarCheck, Wallet, UserCircle,
  Clock, AlertTriangle, MapPin, DollarSign, ArrowRight,
  Zap, Bell,
} from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { AcceptShiftSchema } from '@/lib/validations'
import { notifyShiftAccepted } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const ROLE_GRADIENT: Record<string, string> = {
  NURSE: 'from-sky-500 to-blue-600',
  EN:    'from-violet-500 to-purple-700',
  PCA:   'from-teal to-electric-dim',
}
const ROLE_BG: Record<string, string> = {
  NURSE: 'bg-sky-50   text-sky-700   border-sky-200',
  EN:    'bg-violet-50 text-violet-700 border-violet-200',
  PCA:   'bg-teal/10  text-teal      border-teal/20',
}

async function getWorkerData() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const [availableShifts, myActiveShifts, unreadCount] = await Promise.all([
    prisma.shift.findMany({
      where: { status: 'PENDING', workerId: null },
      include: { facility: true },
      orderBy: [{ urgent: 'desc' }, { startTime: 'asc' }],
    }),
    prisma.shift.count({
      where: { workerId: user.id, status: { in: ['MATCHED', 'CLOCKED_IN'] } },
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ])

  return { user: dbUser, availableShifts, myActiveShifts, unreadCount }
}

export default async function WorkerPortal({ searchParams }: { searchParams: { error?: string; filter?: string } }) {
  const { user, availableShifts, myActiveShifts } = await getWorkerData()
  const errorMessage = searchParams.error
  const filter = searchParams.filter ?? 'all'

  const urgentCount = availableShifts.filter(s => s.urgent).length
  const filteredShifts = filter === 'urgent' ? availableShifts.filter(s => s.urgent) : availableShifts
  const isCompliant = user.complianceStatus === 'GREEN'

  async function acceptShift(formData: FormData) {
    'use server'
    const parsed = AcceptShiftSchema.safeParse({ shiftId: formData.get('shiftId') })
    if (!parsed.success) redirect('/worker?error=Invalid+shift')

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!dbUser) redirect('/login')
    if (dbUser.complianceStatus !== 'GREEN') redirect('/worker?error=compliance_required')

    const shift = await prisma.shift.findUnique({
      where: { id: parsed.data.shiftId },
      include: { facility: true },
    })
    if (!shift || shift.status !== 'PENDING' || shift.workerId) redirect('/worker?error=shift_already_taken')

    const result = await prisma.shift.updateMany({
      where: { id: parsed.data.shiftId, workerId: null, status: 'PENDING' },
      data: { workerId: dbUser.id, status: 'MATCHED' },
    })
    if (result.count === 0) redirect('/worker?error=shift_already_taken')

    await notifyShiftAccepted(dbUser.id, shift!.facility.name, parsed.data.shiftId)
    revalidatePath('/worker')
    revalidatePath('/dashboard')
    revalidatePath('/facility')
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative bg-ink text-white overflow-hidden">
        {/* Mesh background */}
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />

        <div className="relative px-5 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal/80 text-xs font-semibold tracking-widest uppercase mb-0.5">Welcome back</p>
              <h1 className="text-2xl font-black tracking-tight text-white">{user.name ?? 'Worker'}</h1>
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
                value: isCompliant ? 'Compliant' : 'Incomplete',
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

        {/* Compliance banner */}
        {!isCompliant && (
          <a href="/worker/profile" className="block animate-fade-in-up">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 text-sm">Action Required</p>
                <p className="text-amber-700 text-xs mt-0.5">Upload compliance documents to start accepting shifts.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform mt-0.5" />
            </div>
          </a>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-fade-in flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMessage === 'compliance_required' ? 'Complete your compliance documents first.' :
             errorMessage === 'shift_already_taken' ? 'That shift was just taken by another worker.' :
             decodeURIComponent(errorMessage)}
          </div>
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: `All shifts`, count: availableShifts.length },
            { id: 'urgent', label: 'Urgent', count: urgentCount },
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
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink text-base tracking-tight">Available Near You</h2>
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
            <p className="font-bold text-ink text-sm">No shifts available right now</p>
            <p className="text-ink/40 text-xs mt-1 text-center px-8">
              All shifts have been claimed. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filteredShifts.map(shift => {
              const hrs = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
              const est = shift.hourlyRate * hrs
              const gradient = ROLE_GRADIENT[shift.role] ?? 'from-teal to-electric-dim'
              const roleBadge = ROLE_BG[shift.role] ?? 'bg-teal/10 text-teal border-teal/20'

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
                  {/* Role color bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${shift.urgent ? 'from-rose-500 to-rose-600' : gradient}`} />

                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-bold text-ink text-base leading-tight truncate">{shift.facility.name}</p>
                        {shift.urgent && (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            <Zap className="w-2.5 h-2.5" /> URGENT
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-ink text-lg font-mono leading-none">${shift.hourlyRate.toFixed(0)}</p>
                        <p className="text-ink/40 text-[10px] font-medium">/hr</p>
                      </div>
                    </div>

                    {/* Role badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border mb-3 ${roleBadge}`}>
                      {shift.role === 'NURSE' ? 'Registered Nurse' : shift.role === 'EN' ? 'Enrolled Nurse' : 'Personal Care Asst.'}
                    </span>

                    {/* Details */}
                    <div className="space-y-1.5 text-sm text-ink/60">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                        <span className="font-medium">
                          {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                          <span className="text-ink/35 mx-1.5">·</span>
                          {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' – '}
                          {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          <span className="text-ink/35 ml-1.5">({hrs.toFixed(1)}h)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                        <span className="truncate">{shift.facility.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-emerald-600">
                          Est. ${est.toFixed(0)} for this shift
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {shift.notes && (
                      <p className="mt-2.5 text-xs text-ink/45 italic bg-surface-1 rounded-xl px-3 py-2 border border-surface-3">
                        {shift.notes}
                      </p>
                    )}

                    {/* CTA */}
                    <form action={acceptShift} className="mt-4">
                      <input type="hidden" name="shiftId" value={shift.id} />
                      <Button
                        type="submit"
                        className={`w-full h-12 text-base font-bold rounded-xl gap-2 ${
                          shift.urgent
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-glow-rose hover:shadow-glow-rose'
                            : ''
                        }`}
                        disabled={!isCompliant}
                      >
                        {isCompliant ? (
                          <><span>Accept Shift</span><ArrowRight className="w-4 h-4" /></>
                        ) : (
                          'Complete Compliance First'
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Bottom Navigation ───────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl glass-light border-t border-surface-3 flex justify-around pb-safe">
        {[
          { href: '/worker',           icon: CalendarCheck, label: 'Feed',     active: true  },
          { href: '/worker/my-shifts', icon: Clock,         label: 'My Shifts', active: false },
          { href: '/worker/pay',       icon: Wallet,        label: 'Pay',      active: false },
          { href: '/worker/profile',   icon: UserCircle,    label: 'Profile',  active: false },
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
