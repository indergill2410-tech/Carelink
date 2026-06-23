import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { NotificationBell } from '@/components/NotificationBell'
import {
  Building2, Clock, CalendarPlus, AlertTriangle, CheckCircle2,
  Users, TrendingUp, Heart,
  Mail, Phone, Zap,
} from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { signOut } from '@/app/login/actions'
import { Role } from '@prisma/client'
import { fromZonedTime } from 'date-fns-tz'
import { notifyShiftCancelled } from '@/lib/notifications'
import { canCancelShift, shouldNotifyWorkerAboutCancellation } from '@/lib/shift-lifecycle'
import { normaliseOfferedRate, ROLE_RATE_FLOORS } from '@/lib/pay-engine'

const TZ = 'Australia/Melbourne'

export const dynamic = 'force-dynamic'

const ROLE_META: Record<string, { label: string; color: string }> = {
  NURSE: { label: 'RN', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  EN:    { label: 'EN', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  PCA:   { label: 'PCA', color: 'bg-amber-100 text-amber-700 border-amber-200' },
}

const SHIFT_TEMPLATES = [
  { label: 'Morning RN',   role: 'NURSE', start: '07:00', end: '15:00', urgent: false },
  { label: 'Evening EN',   role: 'EN',    start: '15:00', end: '23:00', urgent: false },
  { label: 'Night PCA',    role: 'PCA',   start: '23:00', end: '07:00', urgent: false },
  { label: 'Urgent Cover', role: 'NURSE', start: '07:00', end: '15:00', urgent: true  },
]

const STATUS_BAR: Record<string, string> = {
  PENDING:    'bg-amber-400',
  MATCHED:    'bg-emerald-500',
  CLOCKED_IN: 'bg-blue-500',
  COMPLETED:  'bg-emerald-500',
  CANCELLED:  'bg-stone-300',
}

async function getFacilityData() {
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

  const shifts = await prisma.shift.findMany({
    where: { facilityId: facility.id },
    include: { worker: { select: { id: true, name: true, email: true, phone: true } } },
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
  searchParams: { error?: string; tab?: string; template?: string }
}) {
  const { facility, shifts } = await getFacilityData()
  const error = searchParams.error
  const activeTab = searchParams.tab ?? 'shifts'

  const pending   = shifts.filter(s => s.status === 'PENDING')
  const matched   = shifts.filter(s => s.status === 'MATCHED' || s.status === 'CLOCKED_IN')
  const completed = shifts.filter(s => s.status === 'COMPLETED')
  const selectedTemplate = SHIFT_TEMPLATES.find(t => t.label === searchParams.template)

  const totalHours = completed.reduce((sum, s) => {
    const hrs = (s.endTime.getTime() - s.startTime.getTime()) / 3600000
    return sum + hrs
  }, 0)

  async function cancelShift(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACILITY_ADMIN')) return

    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift || shift.facilityId !== facility.id) return
    if (!canCancelShift(shift.status)) return
    await prisma.shift.update({ where: { id: shiftId }, data: { status: 'CANCELLED' } })
    if (shouldNotifyWorkerAboutCancellation(shift.status, shift.workerId) && shift.workerId) {
      await notifyShiftCancelled(shift.workerId, facility.name, shift.id)
    }
    revalidatePath('/facility')
    revalidatePath('/dashboard')
    revalidatePath('/worker/my-shifts')
  }

  async function requestShift(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACILITY_ADMIN') || dbUser.facilityId !== facility.id) return
    const role = formData.get('role') as string
    const date = formData.get('date') as string
    const startT = (formData.get('startTime') as string) || '07:00'
    const endT   = (formData.get('endTime') as string) || '15:00'
    const notes  = (formData.get('notes') as string) || null
    const urgent = formData.get('urgent') === 'on'
    const repeatWeeksRaw = parseInt((formData.get('repeatWeeks') as string) || '1', 10)
    const repeatWeeks = Number.isFinite(repeatWeeksRaw) ? Math.min(Math.max(repeatWeeksRaw, 1), 12) : 1

    const VALID_ROLES = ['NURSE', 'EN', 'PCA']
    if (!role || !VALID_ROLES.includes(role) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      redirect('/facility?error=Invalid+shift+details')
    }

    const startTime = fromZonedTime(`${date}T${startT}:00`, TZ)
    const endTime   = fromZonedTime(`${date}T${endT}:00`, TZ)

    let normalizedEndTime = endTime
    if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime()) && normalizedEndTime <= startTime) {
      normalizedEndTime = new Date(normalizedEndTime.getTime() + 24 * 60 * 60 * 1000)
    }

    if (isNaN(startTime.getTime()) || isNaN(normalizedEndTime.getTime()) || startTime >= normalizedEndTime) {
      redirect('/facility?error=Invalid+time+range')
    }

    const facilityDefaultRate = facility.defaultRate ? Number(facility.defaultRate) : null
    const baseRate = facilityDefaultRate ?? ROLE_RATE_FLOORS[role as keyof typeof ROLE_RATE_FLOORS] ?? 45.00
    const hourlyRate = normaliseOfferedRate(role, baseRate)

    await prisma.shift.createMany({
      data: Array.from({ length: repeatWeeks }, (_, index) => {
        const weekOffsetMs = index * 7 * 24 * 60 * 60 * 1000
        return {
          facilityId: facility.id,
          role: role as Role,
          startTime: new Date(startTime.getTime() + weekOffsetMs),
          endTime: new Date(normalizedEndTime.getTime() + weekOffsetMs),
          hourlyRate,
          notes: notes || null,
          urgent,
          status: 'PENDING',
        }
      }),
    })

    revalidatePath('/facility')
    revalidatePath('/dashboard')
    redirect('/facility')
  }

  async function updateFacilitySettings(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'FACILITY_ADMIN')) return
    if (dbUser.role === 'FACILITY_ADMIN' && dbUser.facilityId !== facility.id) return

    const name = ((formData.get('name') as string) || '').trim()
    const address = ((formData.get('address') as string) || '').trim()
    const phone = ((formData.get('phone') as string) || '').trim() || null
    const email = ((formData.get('email') as string) || '').trim() || null
    if (!name || !address) return

    await prisma.facility.update({
      where: { id: facility.id },
      data: { name, address, phone, email },
    })

    revalidatePath('/facility')
    revalidatePath('/dashboard')
  }

  const KPI_ITEMS = [
    { label: 'Awaiting Staff', value: pending.length.toString(),       color: 'text-amber-500' },
    { label: 'Confirmed',      value: matched.length.toString(),       color: 'text-emerald-600' },
    { label: 'Completed',      value: completed.length.toString(),     color: 'text-ink' },
    { label: 'Hours of Care',  value: `${totalHours.toFixed(0)}h`,     color: 'text-sky-600' },
  ]

  const TABS = [
    { id: 'shifts',   label: 'Request Staff',    icon: Clock },
    { id: 'roster',   label: 'Your Care Team',   icon: Users },
    { id: 'history',  label: 'Shift History',    icon: TrendingUp },
    { id: 'settings', label: 'Settings',         icon: Building2 },
  ]

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col">

      {/* ── Sticky Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-2">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-electric-dim flex items-center justify-center shadow-btn">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-ink text-sm leading-tight">{facility.name}</p>
              <p className="text-ink/40 text-[11px] leading-tight">{facility.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-5 mr-4">
              {KPI_ITEMS.map(k => (
                <div key={k.label} className="text-center">
                  <p className={`text-lg font-black font-mono leading-none ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-ink/40 leading-none mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
            <NotificationBell tone="light" />
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

        {/* ── Request Staff Tab ───────────────────────────────────────── */}
        {activeTab === 'shifts' && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

            {/* Form Card */}
            <div className="lg:sticky lg:top-[calc(var(--header-h,140px)+1.25rem)] rounded-2xl overflow-hidden shadow-card">
              <div className="bg-gradient-to-br from-teal to-electric-dim px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <CalendarPlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Request a Carer</p>
                    <p className="text-white/60 text-xs">We&apos;ll find the right match for you</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 space-y-4">
                <div>
                  <p className={labelCls}>Quick Templates</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SHIFT_TEMPLATES.map(template => (
                      <a
                        key={template.label}
                        href={`/facility?tab=shifts&template=${encodeURIComponent(template.label)}`}
                        className={[
                          'rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                          selectedTemplate?.label === template.label
                            ? 'border-teal bg-teal/10 text-teal'
                            : 'border-surface-3 bg-surface-1 text-ink/55 hover:border-teal hover:text-teal',
                        ].join(' ')}
                      >
                        {template.label}
                      </a>
                    ))}
                  </div>
                </div>

                <form action={requestShift} className="space-y-4">
                  <div>
                    <label className={labelCls}>Role Needed</label>
                    <select name="role" className={inputCls} defaultValue={selectedTemplate?.role ?? 'NURSE'} required>
                      <option value="NURSE">Registered Nurse (RN)</option>
                      <option value="EN">Enrolled Nurse (EN)</option>
                      <option value="PCA">Personal Care Assistant</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Date</label>
                    <input type="date" name="date" className={inputCls} required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Start</label>
                      <input type="time" name="startTime" defaultValue={selectedTemplate?.start ?? '07:00'} className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>End</label>
                      <input type="time" name="endTime" defaultValue={selectedTemplate?.end ?? '15:00'} className={inputCls} required />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Repeat Weekly</label>
                    <select name="repeatWeeks" defaultValue="1" className={inputCls}>
                      <option value="1">One-off shift</option>
                      <option value="2">Repeat for 2 weeks</option>
                      <option value="4">Repeat for 4 weeks</option>
                      <option value="8">Repeat for 8 weeks</option>
                      <option value="12">Repeat for 12 weeks</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Notes (optional)</label>
                    <textarea
                      name="notes"
                      rows={2}
                      maxLength={500}
                      placeholder="Special requirements or care instructions…"
                      className="w-full rounded-xl border border-surface-3 bg-surface-1 px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input type="checkbox" name="urgent" defaultChecked={selectedTemplate?.urgent ?? false} className="w-4 h-4 rounded accent-rose-500" />
                    <span className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Urgent — needed today
                    </span>
                  </label>

                  <Button type="submit" className="w-full h-11 font-bold">
                    Send Request <Heart className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Open Requests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-ink text-base">Open Requests</h2>
                <span className="text-[11px] font-semibold text-ink/40 bg-surface-2 px-2 py-0.5 rounded-full">
                  {[...pending, ...matched].length} active
                </span>
              </div>

              {[...pending, ...matched].length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-surface-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                    <CalendarPlus className="w-6 h-6 text-ink/30" />
                  </div>
                  <p className="font-semibold text-ink/50 text-sm">No open requests</p>
                  <p className="text-ink/30 text-xs mt-1">Use the form to request a carer</p>
                </div>
              ) : (
                [...pending, ...matched].map(shift => {
                  const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                  const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000
                  return (
                    <div
                      key={shift.id}
                      className="group flex items-center gap-0 bg-white rounded-2xl border border-surface-2 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-[220ms] ease-spring overflow-hidden"
                    >
                      <div className={`w-1 self-stretch shrink-0 ${STATUS_BAR[shift.status] ?? 'bg-stone-300'}`} />

                      <div className="flex items-center gap-4 px-4 py-3.5 flex-1 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${meta.color}`}>
                          {meta.label}
                        </div>

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
                            <span className="font-mono">{hours.toFixed(1)}h</span>
                          </p>
                          {shift.worker ? (
                            <div className="mt-0.5 space-y-1">
                              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {shift.worker.name ?? shift.worker.email}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-ink/40">
                                <a href={`mailto:${shift.worker.email}`} className="inline-flex items-center gap-1 hover:text-teal">
                                  <Mail className="w-3 h-3" />
                                  Email
                                </a>
                                {shift.worker.phone && (
                                  <a href={`tel:${shift.worker.phone}`} className="inline-flex items-center gap-1 hover:text-teal">
                                    <Phone className="w-3 h-3" />
                                    Phone
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-ink/35 mt-0.5">Matching your request…</p>
                          )}
                          {shift.notes && (
                            <p className="text-xs text-ink/35 mt-0.5 italic truncate">{shift.notes}</p>
                          )}
                        </div>

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

        {/* ── Your Care Team Tab ──────────────────────────────────────── */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink text-base">Your Care Team Today</h2>
              <span className="text-[11px] font-semibold text-ink/40 bg-surface-2 px-2 py-0.5 rounded-full">
                {matched.length} confirmed
              </span>
            </div>

            {matched.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-surface-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-ink/30" />
                </div>
                <p className="font-semibold text-ink/50 text-sm">No care team confirmed yet</p>
                <p className="text-ink/30 text-xs mt-1">We&apos;ll notify you as soon as a verified carer accepts</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matched.map(shift => {
                  const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                  const initials = (shift.worker?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={shift.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-2 shadow-card">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border ${meta.color} shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ink text-sm">{shift.worker?.name ?? 'Carer'}</p>
                        <p className="text-xs text-ink/50 mt-0.5">
                          {shift.role === 'NURSE' ? 'Registered Nurse' : shift.role === 'EN' ? 'Enrolled Nurse' : 'Personal Care Assistant'}
                          {' · '}
                          {shift.startTime.toLocaleDateString('en-AU', {
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
                        {shift.worker && (
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-ink/40">
                            <a href={`mailto:${shift.worker.email}`} className="inline-flex items-center gap-1 hover:text-teal">
                              <Mail className="w-3 h-3" />
                              Email
                            </a>
                            {shift.worker.phone && (
                              <a href={`tel:${shift.worker.phone}`} className="inline-flex items-center gap-1 hover:text-teal">
                                <Phone className="w-3 h-3" />
                                Phone
                              </a>
                            )}
                          </div>
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

        {/* ── Shift History Tab ───────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink text-base">Shift History</h2>
              {completed.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-ink/40">Total care hours</p>
                  <p className="font-black font-mono text-ink text-base">{totalHours.toFixed(0)}h</p>
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
                  const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000
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
                          {shift.worker?.name ?? 'Unknown'} · <span className="font-mono">{hours.toFixed(1)}h</span>
                          {' · '}
                          {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' – '}
                          {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-bold">Completed</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Settings Tab ────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-2">
                <p className="font-bold text-ink text-sm">Care Home Settings</p>
              </div>
              <form action={updateFacilitySettings} className="p-5 space-y-4">
                <div>
                  <label className={labelCls}>Care Home Name</label>
                  <input name="name" defaultValue={facility.name} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input name="address" defaultValue={facility.address} required className={inputCls} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input name="phone" defaultValue={facility.phone ?? ''} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input name="email" type="email" defaultValue={facility.email ?? ''} className={inputCls} />
                  </div>
                </div>
                <Button type="submit" className="h-11 px-5">Save Settings</Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
