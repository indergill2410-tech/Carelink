import { redirect } from 'next/navigation'
import {
  Activity, Clock, FileWarning, Users, Zap, CheckCircle, FileCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { isShiftAllowedByAvailability } from '@/lib/availability'
import { requireAdmin, getOverviewData, getSidebarCounts, getFacilityOptions } from './_data'
import { cancelShift, assignWorker, toggleCompliance, approveTimesheet } from './_actions'

export const dynamic = 'force-dynamic'

const auTime = (d: Date) => d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })
const auDate = (d: Date) => d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })

export default async function DashboardOverview() {
  const admin = await requireAdmin()
  if (!admin) redirect('/login?error=Unauthorized')

  const [data, counts, facilities] = await Promise.all([
    getOverviewData(), getSidebarCounts(), getFacilityOptions(),
  ])

  const kpis = [
    { label: 'Total Shifts', value: data.shifts.length, sub: 'Recent activity', icon: Clock, accent: 'text-ink' },
    { label: 'Active Now', value: data.activeShifts.length, sub: 'Confirmed + on shift', icon: Activity, accent: 'text-teal' },
    { label: 'Awaiting Staff', value: data.unfilledShifts.length, sub: 'Need a carer assigned', icon: FileWarning, accent: 'text-amber-600' },
    { label: 'Care Team', value: data.workers.length, sub: `${data.facilitiesCount} care homes`, icon: Users, accent: 'text-ink' },
  ]

  return (
    <DashboardShell title="Care Operations" eyebrow="Overview" counts={counts} facilities={facilities}>
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {kpis.map(kpi => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <Card className="lg:col-span-2 hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-teal" /> Shift Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.shifts.length === 0 ? (
              <div className="p-12 text-center text-ink/40 text-sm">No shifts yet — post one to get started.</div>
            ) : (
              <div className="divide-y divide-surface-2">
                {data.shifts.slice(0, 12).map(s => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 ${
                      s.urgent ? 'bg-rose-100 text-rose-700' :
                      s.role === 'NURSE' ? 'bg-amber-100 text-amber-700' :
                      s.role === 'EN' ? 'bg-sage-100 text-sage-700' : 'bg-clay-100 text-clay-700'
                    }`}>{s.role}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink text-sm truncate">{s.facility.name}</p>
                        {s.urgent && <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-rose-200 shrink-0">URGENT</span>}
                      </div>
                      <p className="text-xs text-ink/45 mt-0.5 font-mono">
                        {auDate(s.startTime)} · {auTime(s.startTime)}–{auTime(s.endTime)} · {s.worker?.name ?? 'Unassigned'}
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

        {/* Right column */}
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
                  w.role === s.role && isShiftAllowedByAvailability(w.availability, s.startTime))
                return (
                  <div key={s.id} className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      {s.urgent && <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">URGENT</span>}
                      <p className="font-bold text-ink text-sm truncate flex-1">{s.role} · {s.facility.name}</p>
                    </div>
                    <p className="text-xs text-ink/50 font-mono">{auDate(s.startTime)} · {auTime(s.startTime)}–{auTime(s.endTime)}</p>
                    {eligibleWorkers.length > 0 ? (
                      <form action={assignWorker} className="flex gap-2">
                        <input type="hidden" name="shiftId" value={s.id} />
                        <select name="workerId" className="flex-1 h-8 rounded-lg border border-surface-3 bg-surface-0 px-2 text-xs text-ink focus:outline-none focus:border-teal transition-all" required>
                          <option value="">Assign a carer…</option>
                          {eligibleWorkers.map(w => <option key={w.id} value={w.id}>{w.name ?? w.email}</option>)}
                        </select>
                        <Button size="sm" type="submit" className="h-8 px-3 text-xs shrink-0">Assign</Button>
                      </form>
                    ) : (
                      <p className="text-xs text-ink/40 italic">No verified carers available for this slot</p>
                    )}
                  </div>
                )
              })}
              {data.complianceAlerts.slice(0, 2).map(w => (
                <div key={w.id} className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="font-bold text-ink text-sm">Certification Issue</p>
                  <p className="text-ink/50 text-xs mt-0.5 mb-3 truncate">{w.name ?? w.email} · {w.role}</p>
                  <form action={toggleCompliance}>
                    <input type="hidden" name="workerId" value={w.id} />
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 border-rose-200 text-rose-900 hover:bg-rose-100" type="submit">Clear for Work</Button>
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
                        <p className="font-bold text-ink text-sm truncate">{s.worker?.name ?? s.worker?.email ?? 'Carer'} · {s.facility.name}</p>
                        <p className="text-xs text-ink/45 font-mono mt-0.5">
                          {auDate(s.startTime)} · {clockIn ? auTime(clockIn) : 'No clock in'} - {clockOut ? auTime(clockOut) : 'No clock out'}
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
    </DashboardShell>
  )
}
