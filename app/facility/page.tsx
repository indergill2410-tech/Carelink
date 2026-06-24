import { AlertTriangle, CalendarPlus, CheckCircle2, Clock, Mail, Phone, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { FacilityShell } from '@/components/facility/FacilityShell'
import { getFacilityContext, getFacilityShifts } from './_data'
import { cancelShift, requestShift, updateFacilitySettings } from './_actions'

export const dynamic = 'force-dynamic'

const ROLE_META: Record<string, { label: string; color: string }> = {
  NURSE: { label: 'RN',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  EN:    { label: 'EN',  color: 'bg-sage-100 text-sage-700 border-sage-200' },
  PCA:   { label: 'PCA', color: 'bg-clay-100 text-clay-700 border-clay-200' },
}

const STATUS_BAR: Record<string, string> = {
  PENDING: 'bg-amber-400', MATCHED: 'bg-emerald-500',
  CLOCKED_IN: 'bg-sage-500', COMPLETED: 'bg-emerald-500', CANCELLED: 'bg-stone-300',
}

const SHIFT_TEMPLATES = [
  { label: 'Morning RN',   role: 'NURSE', start: '07:00', end: '15:00', urgent: false },
  { label: 'Evening EN',   role: 'EN',    start: '15:00', end: '23:00', urgent: false },
  { label: 'Night PCA',    role: 'PCA',   start: '23:00', end: '07:00', urgent: false },
  { label: 'Urgent Cover', role: 'NURSE', start: '07:00', end: '15:00', urgent: true  },
]

const inputCls = 'h-11 w-full rounded-xl border border-surface-3 bg-surface-1 px-4 text-sm text-ink placeholder:text-ink/30 transition-all focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none'
const labelCls = 'block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5'

export default async function FacilityPortal({
  searchParams,
}: {
  searchParams: { error?: string; tab?: string; template?: string }
}) {
  const { facility, kpis } = await getFacilityContext()
  const shifts = await getFacilityShifts(facility.id)

  const error = searchParams.error
  const activeTab = searchParams.tab ?? ''
  const selectedTemplate = SHIFT_TEMPLATES.find(t => t.label === searchParams.template)

  const pending   = shifts.filter(s => s.status === 'PENDING')
  const matched   = shifts.filter(s => s.status === 'MATCHED' || s.status === 'CLOCKED_IN')
  const completed = shifts.filter(s => s.status === 'COMPLETED')
  const totalHours = completed.reduce((sum, s) => sum + Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3600000), 0)

  return (
    <FacilityShell facility={facility} kpis={kpis}>
      {error && (
        <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {decodeURIComponent(error)}
        </div>
      )}

      {/* ── Request Staff (default tab) ── */}
      {(!activeTab || activeTab === 'shifts') && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Form Card */}
          <div className="lg:sticky lg:top-[calc(var(--header-h,200px)+1.25rem)] rounded-2xl overflow-hidden shadow-card">
            <div className="bg-gradient-to-br from-teal to-electric-dim px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <CalendarPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Book a Verified Carer</p>
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
                      href={`/facility?template=${encodeURIComponent(template.label)}`}
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
                    <option value="2">2 weeks</option>
                    <option value="4">4 weeks</option>
                    <option value="8">8 weeks</option>
                    <option value="12">12 weeks</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Notes (optional)</label>
                  <textarea name="notes" rows={2} maxLength={500}
                    placeholder="Special requirements or care instructions…"
                    className="w-full rounded-xl border border-surface-3 bg-surface-1 px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none resize-none transition-all"
                  />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" name="urgent" defaultChecked={selectedTemplate?.urgent ?? false} className="w-4 h-4 rounded accent-rose-500" />
                  <span className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Urgent — needed today
                  </span>
                </label>
                <Button type="submit" className="w-full h-11 font-bold">Send Request</Button>
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal/10 to-electric-dim/10 flex items-center justify-center mx-auto mb-4">
                  <CalendarPlus className="w-7 h-7 text-teal/60" />
                </div>
                <p className="font-bold text-ink/60 text-sm">No open requests yet</p>
                <p className="text-ink/30 text-xs mt-1 max-w-xs mx-auto">Use the form to book a verified carer — we typically match within the hour.</p>
              </div>
            ) : (
              [...pending, ...matched].map(shift => {
                const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000
                return (
                  <div key={shift.id} className="group flex items-center gap-0 bg-white rounded-2xl border border-surface-2 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-[220ms] overflow-hidden">
                    <div className={`w-1 self-stretch shrink-0 ${STATUS_BAR[shift.status] ?? 'bg-stone-300'}`} />
                    <div className="flex items-center gap-4 px-4 py-3.5 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${meta.color}`}>
                        {meta.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-ink text-sm">
                            {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                          </p>
                          {shift.urgent && (
                            <span className="flex items-center gap-0.5 bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              <Zap className="w-2.5 h-2.5" /> URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink/50 mt-0.5">
                          {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' – '}
                          {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' · '}<span className="font-mono">{hours.toFixed(1)}h</span>
                        </p>
                        {shift.worker ? (
                          <div className="mt-0.5 space-y-1">
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />{shift.worker.name ?? shift.worker.email}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-ink/40">
                              <a href={`mailto:${shift.worker.email}`} className="inline-flex items-center gap-1 hover:text-teal"><Mail className="w-3 h-3" /> Email</a>
                              {shift.worker.phone && <a href={`tel:${shift.worker.phone}`} className="inline-flex items-center gap-1 hover:text-teal"><Phone className="w-3 h-3" /> Phone</a>}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-ink/35 mt-0.5">Matching your request…</p>
                        )}
                        {shift.notes && <p className="text-xs text-ink/35 mt-0.5 italic truncate">{shift.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={shift.status} />
                        {(shift.status === 'PENDING' || shift.status === 'MATCHED') && (
                          <form action={cancelShift} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="hidden" name="shiftId" value={shift.id} />
                            <Button type="submit" variant="outline" size="sm" className="text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50">Cancel</Button>
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

      {/* ── Your Care Team (today's roster) ── */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink text-base">Your Care Team Today</h2>
            <a href="/facility/care-team" className="text-xs text-teal hover:underline font-semibold">Full team →</a>
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
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border ${meta.color} shrink-0`}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink text-sm">{shift.worker?.name ?? 'Carer'}</p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {shift.role === 'NURSE' ? 'Registered Nurse' : shift.role === 'EN' ? 'Enrolled Nurse' : 'Personal Care Assistant'}
                        {' · '}
                        {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}–
                        {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                      </p>
                      {shift.worker && (
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-ink/40">
                          <a href={`mailto:${shift.worker.email}`} className="inline-flex items-center gap-1 hover:text-teal"><Mail className="w-3 h-3" /> Email</a>
                          {shift.worker.phone && <a href={`tel:${shift.worker.phone}`} className="inline-flex items-center gap-1 hover:text-teal"><Phone className="w-3 h-3" /> Phone</a>}
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

      {/* ── Shift History ── */}
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
              <TrendingUp className="w-8 h-8 text-ink/20 mx-auto mb-3" />
              <p className="font-semibold text-ink/50 text-sm">No completed shifts yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden divide-y divide-surface-2">
              {completed.map(shift => {
                const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000
                const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                return (
                  <div key={shift.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${meta.color}`}>{meta.label}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm">
                        {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
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

      {/* ── Settings ── */}
      {activeTab === 'settings' && (
        <div className="max-w-xl">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </FacilityShell>
  )
}
