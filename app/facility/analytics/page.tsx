import { BarChart2, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { FacilityShell } from '@/components/facility/FacilityShell'
import { getFacilityContext, getFacilityAnalytics } from '../_data'

export const dynamic = 'force-dynamic'

export default async function FacilityAnalyticsPage() {
  const { facility, kpis } = await getFacilityContext()
  const { shifts, byRole, byMonth, totalHours, fillRate, cancelled } = await getFacilityAnalytics(facility.id)

  const totalShifts = shifts.filter(s => s.status !== 'CANCELLED').length
  const completedShifts = shifts.filter(s => s.status === 'COMPLETED').length
  const avgHours = completedShifts > 0 ? (totalHours / completedShifts) : 0
  const cancelRate = (totalShifts + cancelled) > 0 ? Math.round((cancelled / (totalShifts + cancelled)) * 100) : 0

  const kpiItems = [
    { label: 'Fill Rate', value: `${fillRate}%`, sub: 'shifts filled vs requested', color: fillRate >= 80 ? 'text-emerald-700' : fillRate >= 50 ? 'text-amber-700' : 'text-rose-700' },
    { label: 'Total Care Hours', value: `${totalHours.toFixed(0)}h`, sub: 'completed shifts', color: 'text-amber-700' },
    { label: 'Avg Shift Length', value: `${avgHours.toFixed(1)}h`, sub: 'per completed shift', color: 'text-ink/70' },
    { label: 'Cancellation Rate', value: `${cancelRate}%`, sub: 'of all requests', color: cancelRate > 20 ? 'text-rose-700' : 'text-ink/50' },
  ]

  const roleMax = Math.max(...Object.values(byRole), 1)
  const monthEntries = Object.entries(byMonth).slice(-6)
  const monthMax = Math.max(...monthEntries.map(([, v]) => v), 1)

  const roleColors: Record<string, string> = {
    NURSE: 'bg-amber-500',
    EN:    'bg-sage-500',
    PCA:   'bg-clay-500',
  }
  const roleLabels: Record<string, string> = { NURSE: 'Registered Nurse', EN: 'Enrolled Nurse', PCA: 'Personal Care Assistant' }

  return (
    <FacilityShell facility={facility} kpis={kpis}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="font-black text-ink text-xl tracking-tight">Analytics</h1>
            <p className="text-sm text-ink/45 mt-0.5">Workforce insights for {facility.name}</p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiItems.map(k => (
            <div key={k.label} className="bg-white border border-surface-2 rounded-2xl p-5 shadow-card">
              <p className="text-label text-ink/40 mb-2">{k.label}</p>
              <p className={`text-3xl font-black font-mono ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-ink/30 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {totalShifts === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-surface-3">
            <BarChart2 className="w-10 h-10 text-ink/20 mx-auto mb-4" />
            <p className="font-bold text-ink/50">No shift data yet</p>
            <p className="text-ink/30 text-xs mt-1">Analytics will appear once shifts are completed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly completions */}
            {monthEntries.length > 0 && (
              <div className="bg-white border border-surface-2 rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-ink/40" />
                  <p className="font-bold text-ink text-sm">Monthly Completions</p>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {monthEntries.map(([month, count]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-ink/40">{count}</span>
                      <div
                        className="w-full bg-teal/80 rounded-t-lg transition-all"
                        style={{ height: `${(count / monthMax) * 100}%`, minHeight: 4 }}
                      />
                      <span className="text-[9px] text-ink/35 font-medium">{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role breakdown */}
            <div className="bg-white border border-surface-2 rounded-2xl p-6 shadow-card">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle className="w-4 h-4 text-ink/40" />
                <p className="font-bold text-ink text-sm">Completed Shifts by Role</p>
              </div>
              <div className="space-y-3">
                {Object.entries(byRole).map(([role, count]) => (
                  <div key={role}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-ink/60">{roleLabels[role] ?? role}</span>
                      <span className="text-xs font-black font-mono text-ink">{count}</span>
                    </div>
                    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${roleColors[role] ?? 'bg-stone-400'}`}
                        style={{ width: `${(count / roleMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift status breakdown */}
            <div className="bg-white border border-surface-2 rounded-2xl p-6 shadow-card lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-ink/40" />
                <p className="font-bold text-ink text-sm">All-Time Shift Breakdown</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Completed', count: completedShifts, color: 'text-emerald-600', icon: CheckCircle },
                  { label: 'Active', count: shifts.filter(s => s.status === 'MATCHED' || s.status === 'CLOCKED_IN').length, color: 'text-sage-600', icon: Clock },
                  { label: 'Pending', count: shifts.filter(s => s.status === 'PENDING').length, color: 'text-amber-600', icon: Clock },
                  { label: 'Cancelled', count: cancelled, color: 'text-rose-500', icon: XCircle },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-xl bg-surface-1 border border-surface-2">
                    <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-2 opacity-70`} />
                    <p className={`text-2xl font-black font-mono ${item.color}`}>{item.count}</p>
                    <p className="text-xs text-ink/40 font-semibold mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </FacilityShell>
  )
}
