import { Button } from '@/components/ui/button'
import {
  Clock, AlertTriangle, MapPin, ArrowRight, Zap, ShieldCheck,
  Star, Building2, TrendingUp, CalendarCheck, Sparkles, LogIn,
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { WorkerBottomNav } from '@/components/worker/WorkerBottomNav'
import { calculateShiftPay } from '@/lib/pay-engine'
import { getWorkerHome } from './_data'
import { acceptShift } from './_actions'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  NURSE: 'Registered Nurse', EN: 'Enrolled Nurse', PCA: 'Personal Care Asst.',
}
const TZ = 'Australia/Melbourne'

function fmtDay(d: Date) {
  return d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ })
}
function fmtTimeRange(a: Date, b: Date) {
  const t = (d: Date) => d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  return `${t(a)} – ${t(b)}`
}

export default async function WorkerHome({
  searchParams,
}: {
  searchParams: { error?: string; success?: string }
}) {
  const home = await getWorkerHome()
  const { user, isCompliant, earnings, stats, expiringSoon, todaysShift, comingUp, offers } = home

  const maxBar = Math.max(...earnings.bars.map(b => b.amount), 1)

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto">

      {/* ── Header ── with photo background */}
      <header className="relative bg-ink text-white overflow-hidden">
        {/* Hero photo — subtle, warm */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'center 15%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/95 via-ink/80 to-ink/70" />
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
        <div className="relative px-5 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal/80 text-xs font-semibold tracking-widest uppercase mb-0.5">Welcome back</p>
              <h1 className="text-2xl font-black tracking-tight text-white">{user.name ?? 'Carer'}</h1>
              <div className="mt-2 flex items-center gap-2">
                <span className="glass px-2.5 py-1 rounded-lg text-white/80 text-[11px] font-bold uppercase tracking-wide">
                  {user.role}
                </span>
                {isCompliant ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide">
                    <AlertTriangle className="w-3 h-3" /> Setup needed
                  </span>
                )}
              </div>
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
            <ShieldCheck className="w-4 h-4 shrink-0" /> Shift accepted — see it under My Shifts.
          </div>
        )}
        {searchParams.error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {searchParams.error === 'shift_already_taken' ? 'That shift was just taken by another carer.' :
             searchParams.error === 'compliance_required' ? 'Complete your profile before accepting shifts.' :
             decodeURIComponent(searchParams.error)}
          </div>
        )}

        {/* Profile completion banner */}
        {!isCompliant && (
          <a href="/worker/profile" className="block animate-fade-in-up">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
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

        {/* ── Earnings this week ── */}
        <section className="bg-white rounded-2xl border border-surface-3 shadow-card overflow-hidden">
          <div className="bg-gradient-to-br from-ink to-[#2a2522] px-5 py-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest">This week</p>
                {earnings.hasHistory ? (
                  <p className="font-black font-mono text-3xl leading-none mt-1">${earnings.weekTotal.toFixed(2)}</p>
                ) : (
                  <p className="font-black text-lg leading-tight mt-1.5">Your earnings start here</p>
                )}
              </div>
              <a href="/worker/pay" className="inline-flex items-center gap-1 text-teal text-xs font-bold hover:underline">
                Pay <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            {/* 7-day mini bars */}
            <div className="mt-4 flex items-end gap-1.5 h-12">
              {earnings.bars.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-t ${b.amount > 0 ? 'bg-teal' : 'bg-white/10'}`}
                    style={{ height: `${Math.max((b.amount / maxBar) * 100, 4)}%` }}
                  />
                  <span className="text-[9px] text-white/40 font-bold">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Stat tiles */}
          <div className="grid grid-cols-4 divide-x divide-surface-2">
            {[
              { icon: Star,          label: 'Rating',     value: stats.rating != null ? stats.rating.toFixed(1) : '—' },
              { icon: CalendarCheck, label: 'Shifts',     value: stats.totalShifts.toString() },
              { icon: Building2,     label: 'Facilities', value: stats.distinctFacilities.toString() },
              { icon: TrendingUp,    label: 'Top',        value: stats.percentile != null ? `${stats.percentile}%` : '—' },
            ].map(t => (
              <div key={t.label} className="px-2 py-3 text-center">
                <t.icon className="w-3.5 h-3.5 text-teal mx-auto mb-1" />
                <p className="font-black text-ink font-mono text-base leading-none">{t.value}</p>
                <p className="text-[9px] font-semibold text-ink/40 uppercase tracking-wider mt-1">{t.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Credential alert ── */}
        {expiringSoon.length > 0 && (
          <a href="/worker/credentials" className="block">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 text-sm">
                  {expiringSoon.length === 1 ? 'A credential is expiring soon' : `${expiringSoon.length} credentials expiring soon`}
                </p>
                <p className="text-amber-700 text-xs mt-0.5">
                  {expiringSoon[0].label}{' '}
                  {expiringSoon[0].days < 0 ? 'has expired' : expiringSoon[0].days === 0 ? 'expires today' : `expires in ${expiringSoon[0].days} days`}. Renew to keep getting shifts.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        )}

        {/* ── Today's shift ── */}
        {todaysShift && (
          <section>
            <h2 className="font-bold text-ink text-base tracking-tight mb-2.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Today
            </h2>
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-card overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal" />
              <div className="p-4">
                <p className="font-bold text-ink text-base">{todaysShift.facility.name}</p>
                <div className="mt-2 space-y-1.5 text-sm text-ink/60">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                    <span className="font-medium">{fmtTimeRange(todaysShift.startTime, todaysShift.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                    <span className="truncate">{todaysShift.facility.address}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2.5">
                  <Button asChild className="flex-1 h-11 font-bold gap-2">
                    <a href="/worker/my-shifts">
                      {todaysShift.status === 'CLOCKED_IN' ? 'View shift' : <>Check in <LogIn className="w-4 h-4" /></>}
                    </a>
                  </Button>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(todaysShift.facility.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="h-11 px-4 rounded-xl border border-surface-3 text-ink/55 font-bold flex items-center gap-1.5 text-sm"
                  >
                    <MapPin className="w-4 h-4" /> Directions
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── New shift offers ── */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-bold text-ink text-base tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal" /> New shift offers
            </h2>
            <a href="/worker/shifts" className="text-xs font-bold text-teal hover:underline inline-flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-surface-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
                <CalendarCheck className="w-6 h-6 text-ink/25" />
              </div>
              <p className="font-bold text-ink text-sm">No offers right now</p>
              <p className="text-ink/40 text-xs mt-1 text-center px-8">New shifts that match your role and availability will land here.</p>
              <a href="/worker/shifts" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline">
                Browse all open shifts <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map(shift => {
                const pay = calculateShiftPay(shift)
                return (
                  <div key={shift.id} className={`bg-white rounded-2xl border overflow-hidden shadow-card ${shift.urgent ? 'border-rose-200' : 'border-surface-3'}`}>
                    <div className={`h-1.5 w-full bg-gradient-to-r ${shift.urgent ? 'from-rose-500 to-rose-600' : 'from-amber-500 to-amber-700'}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-bold text-ink text-base truncate">{shift.facility.name}</p>
                          {shift.urgent && (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              <Zap className="w-2.5 h-2.5" /> URGENT
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-bold text-emerald-700">{ROLE_LABEL[shift.role] ?? shift.role}</span>
                      </div>
                      <div className="space-y-1.5 text-sm text-ink/60">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                          <span className="font-medium">{fmtDay(shift.startTime)} · {fmtTimeRange(shift.startTime, shift.endTime)} <span className="text-ink/35">({pay.hours.toFixed(1)}h)</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                          <span className="truncate">{shift.facility.address}</span>
                        </div>
                      </div>
                      <div className="mt-3.5 flex gap-2.5">
                        <a href={`/worker/shifts?confirm=${shift.id}`} className="h-11 px-4 rounded-xl border border-surface-3 text-ink/55 font-bold flex items-center justify-center text-sm">
                          View
                        </a>
                        {isCompliant ? (
                          <form action={acceptShift} className="flex-1">
                            <input type="hidden" name="shiftId" value={shift.id} />
                            <input type="hidden" name="redirectTo" value="/worker" />
                            <Button type="submit" className={`w-full h-11 font-bold gap-2 ${shift.urgent ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-glow-rose' : ''}`}>
                              Accept <ArrowRight className="w-4 h-4" />
                            </Button>
                          </form>
                        ) : (
                          <Button asChild variant="secondary" className="flex-1 h-11 font-bold">
                            <a href="/worker/profile">Complete profile</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/worker/schedule',      icon: CalendarCheck, label: 'Schedule' },
            { href: '/worker/credentials',   icon: ShieldCheck,   label: 'Credentials' },
            { href: '/worker/notifications', icon: Sparkles,      label: 'Alerts' },
          ].map(l => (
            <a key={l.href} href={l.href} className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-surface-3 shadow-card py-4 hover:border-teal/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center">
                <l.icon className="w-4 h-4 text-teal" />
              </div>
              <span className="text-xs font-bold text-ink/70">{l.label}</span>
            </a>
          ))}
        </div>

        {/* ── Coming up ── */}
        {comingUp.length > 0 && (
          <section>
            <h2 className="font-bold text-ink text-base tracking-tight mb-2.5">Coming up</h2>
            <div className="bg-white rounded-2xl border border-surface-3 shadow-card overflow-hidden divide-y divide-surface-1">
              {comingUp.map(shift => (
                <a key={shift.id} href="/worker/my-shifts" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-1 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-4 h-4 text-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{shift.facility.name}</p>
                    <p className="text-xs text-ink/45 mt-0.5">{fmtDay(shift.startTime)} · {fmtTimeRange(shift.startTime, shift.endTime)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink/25 shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <WorkerBottomNav />
    </div>
  )
}
