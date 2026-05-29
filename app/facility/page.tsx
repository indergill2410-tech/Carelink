import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Building2, Clock, CalendarPlus, AlertTriangle, CheckCircle2,
  Users, TrendingUp, Activity, Zap, DollarSign,
} from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { signOut } from '@/app/login/actions'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ROLE_RATES: Record<string, number> = {
  NURSE: 55.00,
  EN: 45.00,
  PCA: 32.50,
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  NURSE: { label: 'RN', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  EN:    { label: 'EN', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  PCA:   { label: 'PCA', color: 'bg-teal/10 text-teal border-teal/20' },
}

const STATUS_BAR: Record<string, string> = {
  PENDING:    'bg-amber-400',
  MATCHED:    'bg-teal',
  CLOCKED_IN: 'bg-blue-500',
  COMPLETED:  'bg-emerald-500',
  CANCELLED:  'bg-slate-300',
}

async function getFacilityData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/login')

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

  const shifts = await prisma.shift.findMany({
    where: { facilityId: facility.id },
    include: { worker: true },
    orderBy: { startTime: 'desc' },
    take: 50,
  })

  return { facility, shifts }
}

const inputCls = 'h-11 w-full rounded-xl border border-surface-3 bg-surface-1 px-4 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none'
const labelCls = 'block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5'

export default async function FacilityPortal({
  searchParams,
}: {
  searchParams: { error?: string; tab?: string }
}) {
  const { facility, shifts } = await getFacilityData()
  const error = searchParams.error
  const activeTab = searchParams.tab ?? 'shifts'

  const pending   = shifts.filter(s => s.status === 'PENDING')
  const matched   = shifts.filter(s => s.status === 'MATCHED' || s.status === 'CLOCKED_IN')
  const completed = shifts.filter(s => s.status === 'COMPLETED')
  const totalSpend = completed.reduce((sum, s) => {
    const hrs = (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000
    return sum + s.hourlyRate * hrs
  }, 0)

  async function cancelShift(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || dbUser.role !== 'ADMIN') return

    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift || shift.facilityId !== facility.id) return
    await prisma.shift.update({ where: { id: shiftId }, data: { status: 'CANCELLED' } })
    revalidatePath('/facility')
  }

  async function requestShift(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || dbUser.role !== 'ADMIN' || dbUser.facilityId !== facility.id) return
    const role = formData.get('role') as string
    const date = formData.get('date') as string
    const startT = (formData.get('startTime') as string) || '07:00'
    const endT   = (formData.get('endTime') as string) || '15:00'
    const rateRaw = formData.get('hourlyRate') as string
    const notes  = (formData.get('notes') as string) || null
    const urgent = formData.get('urgent') === 'on'

    if (!role || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      redirect('/facility?error=Invalid+shift+details')
    }

    const startTime = new Date(`${date}T${startT}:00+10:00`)
    const endTime   = new Date(`${date}T${endT}:00+10:00`)

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || startTime >= endTime) {
      redirect('/facility?error=Invalid+time+range')
    }

    const hourlyRate = parseFloat(rateRaw) || ROLE_RATES[role] || 45.00

    await prisma.shift.create({
      data: {
        facilityId: facility.id,
        role: role as Role,
        startTime,
        endTime,
        hourlyRate,
        notes: notes || null,
        urgent,
        status: 'PENDING',
      },
    })

    revalidatePath('/facility')
    revalidatePath('/dashboard')
    redirect('/facility')
  }

  const KPI_ITEMS = [
    { label: 'Awaiting Staff', value: pending.length.toString(),       color: 'text-amber-500' },
    { label: 'Confirmed',      value: matched.length.toString(),       color: 'text-teal' },
    { label: 'Completed',      value: completed.length.toString(),     color: 'text-emerald-500' },
    { label: 'Total Spend',    value: `$${totalSpend.toFixed(0)}`,     color: 'text-ink' },
  ]

  const TABS = [
    { id: 'shifts',  label: 'Shift Requests', icon: Clock },
    { id: 'roster',  label: 'Live Roster',    icon: Users },
    { id: 'history', label: 'History',        icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col">

      {/* ── Sticky Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-2">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-btn">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-ink text-sm leading-tight">{facility.name}</p>
              <p className="text-ink/40 text-[11px] leading-tight">{facility.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* KPIs inline in header for desktop */}
            <div className="hidden md:flex items-center gap-5 mr-4">
              {KPI_ITEMS.map(k => (
                <div key={k.label} className="text-center">
                  <p className={`text-lg font-black font-mono leading-none ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-ink/40 leading-none mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm" className="text-xs h-8">Sign Out</Button>
            </form>
          </div>
        </div>

        {/* Mobile KPI strip */}
        <div className="md:hidden grid grid-cols-4 border-t border-surface-2">
          {KPI_ITEMS.map(k => (
            <div key={k.label} className="py-2.5 text-center border-r border-surface-2 last:border-r-0">
              <p className={`text-base font-black font-mono leading-none ${k.color}`}>{k.value}</p>
              <p className="text-[9px] text-ink/40 mt-0.5 leading-none px-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 border-t border-surface-2">
          {TABS.map(tab => (
            <a
              key={tab.id}
              href={`/facility?tab=${tab.id}`}
              className={[
                'flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors relative',
                activeTab === tab.id
                  ? 'text-teal'
                  : 'text-ink/40 hover:text-ink/70',
              ].join(' ')}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-teal rounded-full" />
              )}
            </a>
          ))}
        </div>
      </header>

      <main className="flex-1 p-5 max-w-6xl mx-auto w-full">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {decodeURIComponent(error)}
          </div>
        )}

        {/* ── Shifts Tab ─────────────────────────────────────────────── */}
        {activeTab === 'shifts' && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

            {/* Form Card */}
            <div className="lg:sticky lg:top-[calc(var(--header-h,140px)+1.25rem)] rounded-2xl overflow-hidden shadow-card">
              {/* Gradient header */}
              <div className="bg-gradient-to-br from-sky-500 to-blue-700 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <CalendarPlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">New Shift Request</p>
                    <p className="text-white/60 text-xs">Broadcast to available workers</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 space-y-4">
                <form action={requestShift} className="space-y-4">
                  <div>
                    <label className={labelCls}>Role Needed</label>
                    <select name="role" className={inputCls} required>
                      <option value="NURSE">Registered Nurse (RN) — ${ROLE_RATES.NURSE}/hr</option>
                      <option value="EN">Enrolled Nurse (EN) — ${ROLE_RATES.EN}/hr</option>
                      <option value="PCA">Personal Care Assistant — ${ROLE_RATES.PCA}/hr</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Date</label>
                    <input type="date" name="date" className={inputCls} required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Start</label>
                      <input type="time" name="startTime" defaultValue="07:00" className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>End</label>
                      <input type="time" name="endTime" defaultValue="15:00" className={inputCls} required />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Hourly Rate ($)</label>
                    <input
                      type="number"
                      name="hourlyRate"
                      step="0.50"
                      min="20"
                      max="200"
                      placeholder="Leave blank for default"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Notes (optional)</label>
                    <textarea
                      name="notes"
                      rows={2}
                      maxLength={500}
                      placeholder="Special requirements…"
                      className="w-full rounded-xl border border-surface-3 bg-surface-1 px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input type="checkbox" name="urgent" className="w-4 h-4 rounded accent-rose-500" />
                    <span className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Mark as Urgent
                    </span>
                  </label>

                  <Button type="submit" className="w-full h-11 font-bold">
                    Broadcast Request <Activity className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Active Shifts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-ink text-base">Active Requests</h2>
                <span className="text-[11px] font-semibold text-ink/40 bg-surface-2 px-2 py-0.5 rounded-full">
                  {[...pending, ...matched].length} shifts
                </span>
              </div>

              {[...pending, ...matched].length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-surface-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                    <CalendarPlus className="w-6 h-6 text-ink/30" />
                  </div>
                  <p className="font-semibold text-ink/50 text-sm">No active shift requests</p>
                  <p className="text-ink/30 text-xs mt-1">Use the form to broadcast a new one</p>
                </div>
              ) : (
                [...pending, ...matched].map(shift => {
                  const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                  const hrs = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
                  return (
                    <div
                      key={shift.id}
                      className="group flex items-center gap-0 bg-white rounded-2xl border border-surface-2 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-[220ms] ease-spring overflow-hidden"
                    >
                      {/* Status strip */}
                      <div className={`w-1 self-stretch shrink-0 ${STATUS_BAR[shift.status] ?? 'bg-slate-300'}`} />

                      <div className="flex items-center gap-4 px-4 py-3.5 flex-1 min-w-0">
                        {/* Role badge */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${meta.color}`}>
                          {meta.label}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-ink text-sm">
                              {shift.startTime.toLocaleDateString('en-AU', {
                                weekday: 'short', month: 'short', day: 'numeric',
                                timeZone: 'Australia/Melbourne',
                              })}
                            </p>
                            {shift.urgent && (
                              <span className="flex items-center gap-0.5 bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                <Zap className="w-2.5 h-2.5" /> URGENT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {shift.startTime.toLocaleTimeString('en-AU', {
                              hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
                            })}
                            {' – '}
                            {shift.endTime.toLocaleTimeString('en-AU', {
                              hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
                            })}
                            {' · '}
                            <span className="font-mono">{hrs.toFixed(1)}h</span>
                            {' · '}
                            <span className="font-mono">${shift.hourlyRate.toFixed(0)}/hr</span>
                          </p>
                          {shift.worker ? (
                            <p className="text-xs text-teal font-medium mt-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {shift.worker.name ?? shift.worker.email}
                            </p>
                          ) : (
                            <p className="text-xs text-ink/35 mt-0.5">Awaiting worker</p>
                          )}
                          {shift.notes && (
                            <p className="text-xs text-ink/35 mt-0.5 italic truncate">{shift.notes}</p>
                          )}
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={shift.status} />
                          {(shift.status === 'PENDING' || shift.status === 'MATCHED') && (
                            <form action={cancelShift} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <input type="hidden" name="shiftId" value={shift.id} />
                              <Button type="submit" variant="outline" size="sm" className="text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50">
                                Cancel
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── Roster Tab ─────────────────────────────────────────────── */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink text-base">Live Roster — Confirmed Staff</h2>
              <span className="text-[11px] font-semibold text-ink/40 bg-surface-2 px-2 py-0.5 rounded-full">
                {matched.length} on roster
              </span>
            </div>

            {matched.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-surface-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-ink/30" />
                </div>
                <p className="font-semibold text-ink/50 text-sm">No confirmed staff</p>
                <p className="text-ink/30 text-xs mt-1">Shift requests will appear here when matched</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matched.map(shift => {
                  const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                  const initials = (shift.worker?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={shift.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-2 shadow-card">
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border ${meta.color} shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ink text-sm">{shift.worker?.name ?? 'Worker'}</p>
                        <p className="text-xs text-ink/50 mt-0.5">
                          {shift.role} · {shift.startTime.toLocaleDateString('en-AU', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            timeZone: 'Australia/Melbourne',
                          })}{' '}
                          {shift.startTime.toLocaleTimeString('en-AU', {
                            hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
                          })}–{shift.endTime.toLocaleTimeString('en-AU', {
                            hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
                          })}
                        </p>
                        {shift.clockInAt && (
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            Clocked in {shift.clockInAt.toLocaleTimeString('en-AU', {
                              hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
                            })}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={shift.status} showDot />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── History Tab ────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink text-base">Shift History</h2>
              {completed.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-ink/40">Total spend</p>
                  <p className="font-black font-mono text-ink text-base">${totalSpend.toFixed(2)}</p>
                </div>
              )}
            </div>

            {completed.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-surface-3">
                <p className="font-semibold text-ink/50 text-sm">No completed shifts yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden divide-y divide-surface-2">
                {completed.map(shift => {
                  const hrs = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
                  const cost = shift.hourlyRate * hrs
                  const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                  return (
                    <div key={shift.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${meta.color}`}>
                        {meta.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink text-sm">
                          {shift.startTime.toLocaleDateString('en-AU', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            timeZone: 'Australia/Melbourne',
                          })}
                        </p>
                        <p className="text-xs text-ink/45 mt-0.5">
                          {shift.worker?.name ?? 'Unknown'} · <span className="font-mono">{hrs.toFixed(1)}h @ ${shift.hourlyRate}/hr</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black font-mono text-emerald-600 text-sm">${cost.toFixed(2)}</p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-500 font-bold uppercase">Completed</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
