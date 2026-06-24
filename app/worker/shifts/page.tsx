import { Button } from '@/components/ui/button'
import {
  CalendarCheck, Clock, AlertTriangle, MapPin, ArrowRight,
  Zap, ShieldCheck, CheckCircle2,
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { WorkerBottomNav } from '@/components/worker/WorkerBottomNav'
import { hasAvailability, isShiftAllowedByAvailability } from '@/lib/availability'
import { calculateShiftPay } from '@/lib/pay-engine'
import { getEligibleShifts } from '../_data'
import { acceptShift } from '../_actions'

export const dynamic = 'force-dynamic'

const ROLE_GRADIENT: Record<string, string> = {
  NURSE: 'from-sky-500 to-blue-600',
  EN:    'from-violet-500 to-purple-700',
  PCA:   'from-amber-500 to-amber-700',
}
const ROLE_BG: Record<string, string> = {
  NURSE: 'bg-sky-50    text-sky-700    border-sky-200',
  EN:    'bg-violet-50 text-violet-700 border-violet-200',
  PCA:   'bg-amber-50  text-amber-700  border-amber-200',
}
const WORKER_ROLES = ['NURSE', 'EN', 'PCA'] as const
const ROLE_LABEL: Record<string, string> = {
  NURSE: 'Registered Nurse', EN: 'Enrolled Nurse', PCA: 'Personal Care Asst.',
}

function melbourneDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Australia/Melbourne',
  }).formatToParts(date)
  const by = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return `${by.year}-${by.month}-${by.day}`
}

export default async function FindShiftsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; filter?: string; role?: string; date?: string; confirm?: string }
}) {
  const { user, openShifts, isCompliant } = await getEligibleShifts()

  const filter = searchParams.filter ?? 'all'
  const roleFilter = searchParams.role === 'ALL' || WORKER_ROLES.includes(searchParams.role as never)
    ? searchParams.role!
    : user.role
  const dateFilter = searchParams.date ?? ''

  const matched = openShifts.filter(s => isShiftAllowedByAvailability(user.availability, s.startTime))
  const availabilityActive = hasAvailability(user.availability)
  const urgentCount = matched.filter(s => s.urgent).length

  const filtered = matched.filter(s => {
    if (filter === 'urgent' && !s.urgent) return false
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false
    if (dateFilter && melbourneDateKey(s.startTime) !== dateFilter) return false
    return true
  })

  const confirmShift = searchParams.confirm ? matched.find(s => s.id === searchParams.confirm) : null
  const confirmPay = confirmShift ? calculateShiftPay(confirmShift) : null

  function feedHref(next: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    params.set('filter', next.filter ?? filter)
    params.set('role', next.role ?? roleFilter)
    if (next.date ?? dateFilter) params.set('date', next.date ?? dateFilter)
    if (next.confirm) params.set('confirm', next.confirm)
    return `/worker/shifts?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto">

      {/* Header */}
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
        <div className="relative px-5 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal/80 text-xs font-semibold tracking-widest uppercase mb-0.5">Find shifts</p>
              <h1 className="text-2xl font-black tracking-tight text-white">Open near you</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 space-y-4 overflow-y-auto">

        {searchParams.success === 'accepted' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Shift accepted — see it under My Shifts.
          </div>
        )}

        {searchParams.error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-fade-in flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {searchParams.error === 'compliance_required' ? 'Please complete your profile before accepting shifts.' :
             searchParams.error === 'shift_already_taken' ? 'That shift was just taken by another carer. Keep an eye out for new ones!' :
             searchParams.error === 'availability_mismatch' ? 'That shift falls outside your saved availability.' :
             decodeURIComponent(searchParams.error)}
          </div>
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all',    label: 'All shifts', count: matched.length },
            { id: 'urgent', label: 'Urgent',     count: urgentCount },
          ].map(f => (
            <a
              key={f.id}
              href={feedHref({ filter: f.id, confirm: undefined })}
              className={[
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150',
                filter === f.id ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-ink/50 border border-surface-3 hover:border-ink/20 hover:text-ink/70',
              ].join(' ')}
            >
              {f.id === 'urgent' && <Zap className="w-3 h-3" />}
              {f.label}
              <span className={`ml-0.5 ${filter === f.id ? 'text-white/60' : 'text-ink/35'}`}>{f.count}</span>
            </a>
          ))}
          {availabilityActive && (
            <a href="/worker/profile" className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal/10 text-teal border border-teal/20">
              <Clock className="w-3 h-3" />
              Availability active
            </a>
          )}
        </div>

        {/* Search filters */}
        <form action="/worker/shifts" className="bg-white rounded-2xl border border-surface-3 shadow-card p-3 grid grid-cols-2 gap-3">
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
            <a href="/worker/shifts" className="h-10 px-3 rounded-xl border border-surface-3 bg-white text-xs font-bold text-ink/50 flex items-center justify-center">Reset</a>
          </div>
        </form>

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink text-base tracking-tight">Shifts Matching Your Profile</h2>
          {filtered.length > 0 && <p className="text-xs text-ink/40 font-medium">{filtered.length} open</p>}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-surface-3 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
              <CalendarCheck className="w-7 h-7 text-ink/25" />
            </div>
            <p className="font-bold text-ink text-sm">No shifts match right now</p>
            <p className="text-ink/40 text-xs mt-1 text-center px-8">
              Widen your travel radius or check back soon — new shifts appear here as facilities post them.
            </p>
            <a href="/worker/profile" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline">
              Update availability <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filtered.map(shift => {
              const pay = calculateShiftPay(shift)
              const gradient = ROLE_GRADIENT[shift.role] ?? 'from-amber-500 to-amber-700'
              const roleBadge = ROLE_BG[shift.role] ?? 'bg-amber-50 text-amber-700 border-amber-200'
              return (
                <div
                  key={shift.id}
                  className={[
                    'bg-white rounded-2xl border overflow-hidden shadow-card transition-all duration-[220ms] ease-spring',
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
                      <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
                        <ShieldCheck className="w-2.5 h-2.5" /> Award wages
                      </span>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border mb-3 ${roleBadge}`}>
                      {ROLE_LABEL[shift.role] ?? shift.role}
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
                      <p className="mt-2.5 text-xs text-ink/45 italic bg-surface-1 rounded-xl px-3 py-2 border border-surface-3">{shift.notes}</p>
                    )}

                    <div className="mt-4">
                      {isCompliant ? (
                        <Button asChild className={`w-full h-12 text-base font-bold rounded-xl gap-2 ${shift.urgent ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-glow-rose hover:shadow-glow-rose' : ''}`}>
                          <a href={feedHref({ confirm: shift.id })}><span>Accept This Shift</span><ArrowRight className="w-4 h-4" /></a>
                        </Button>
                      ) : (
                        <Button asChild className="w-full h-12 text-base font-bold rounded-xl" variant="secondary">
                          <a href="/worker/profile">Complete Your Profile First</a>
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

      {/* Confirm modal */}
      {confirmShift && confirmPay && (
        <div className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-5">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-modal border border-surface-2 overflow-hidden animate-fade-in-up">
            <div className={`h-1.5 bg-gradient-to-r ${confirmShift.urgent ? 'from-rose-500 to-rose-600' : ROLE_GRADIENT[confirmShift.role] ?? 'from-amber-500 to-amber-700'}`} />
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1">Confirm shift</p>
                <h2 className="text-xl font-black text-ink">{confirmShift.facility.name}</h2>
                <p className="text-sm text-ink/45 mt-1">{confirmShift.facility.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-1 border border-surface-2 p-3">
                  <p className="text-[10px] font-bold text-ink/35 uppercase tracking-wider">Role</p>
                  <p className="font-black text-ink mt-1">{ROLE_LABEL[confirmShift.role] ?? confirmShift.role}</p>
                </div>
                <div className="rounded-2xl bg-surface-1 border border-surface-2 p-3">
                  <p className="text-[10px] font-bold text-ink/35 uppercase tracking-wider">Duration</p>
                  <p className="font-black text-ink mt-1">{confirmPay.hours.toFixed(1)}h</p>
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
                <a href={feedHref({ confirm: undefined })} className="h-12 flex-1 rounded-xl border border-surface-3 text-ink/55 font-bold flex items-center justify-center">Go Back</a>
                <form action={acceptShift} className="flex-1">
                  <input type="hidden" name="shiftId" value={confirmShift.id} />
                  <input type="hidden" name="redirectTo" value="/worker/shifts" />
                  <Button type="submit" className="w-full h-12 font-black">Confirm Shift</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <WorkerBottomNav />
    </div>
  )
}
