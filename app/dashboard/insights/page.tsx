import { redirect } from 'next/navigation'
import { TrendingUp, BarChart3, Activity, Star, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { requireAdmin, getInsightsData, getSidebarCounts, getFacilityOptions } from '../_data'

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/login?error=Unauthorized')

  const [data, counts, facilities] = await Promise.all([
    getInsightsData(), getSidebarCounts(), getFacilityOptions(),
  ])
  const { shifts, workers, completed, totalHours, monthlyData } = data

  const fillRate = shifts.length > 0 ? Math.round((completed.length / shifts.length) * 100) : 0
  const cancelled = shifts.filter(s => s.status === 'CANCELLED').length
  const cancelRate = shifts.length > 0 ? Math.round((cancelled / shifts.length) * 100) : 0
  const avgHours = completed.length > 0 ? totalHours / completed.length : 0
  const maxShifts = Math.max(...monthlyData.map(([, v]) => v.shifts), 1)
  const roleDistrib = {
    NURSE: shifts.filter(s => s.role === 'NURSE').length,
    EN: shifts.filter(s => s.role === 'EN').length,
    PCA: shifts.filter(s => s.role === 'PCA').length,
  }

  const kpis = [
    { label: 'Fill Rate', value: `${fillRate}%`, sub: 'of shifts covered', bar: fillRate },
    { label: 'Care Hours Delivered', value: `${Math.round(totalHours)}h`, sub: 'total hours of care', bar: null },
    { label: 'Avg Shift Length', value: `${avgHours.toFixed(1)}h`, sub: 'average duration', bar: null },
    { label: 'Cancellation Rate', value: `${cancelRate}%`, sub: `${cancelled} cancelled shifts`, bar: cancelRate },
  ]

  return (
    <DashboardShell title="Insights" eyebrow="Analytics" counts={counts} facilities={facilities}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="hover:shadow-card-hover transition-shadow duration-300">
            <CardContent className="p-5">
              <p className="text-label text-ink/40 mb-2">{kpi.label}</p>
              <p className="text-3xl font-black font-mono text-ink">{kpi.value}</p>
              <p className="text-xs text-ink/40 mt-1">{kpi.sub}</p>
              {kpi.bar !== null && (
                <div className="mt-3 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-electric rounded-full transition-all duration-700" style={{ width: `${kpi.bar}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4 text-teal" /> Monthly Shifts Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {monthlyData.length === 0 ? (
              <p className="text-ink/40 text-center py-8 text-sm">No completed shifts yet.</p>
            ) : (
              <div className="flex items-end gap-2 h-36">
                {monthlyData.map(([month, v]) => {
                  const pct = (v.shifts / maxShifts) * 100
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <p className="text-[9px] text-teal font-bold opacity-0 group-hover:opacity-100 transition-opacity">{v.shifts} shifts</p>
                      <div className="w-full rounded-t-lg bg-gradient-electric opacity-80 group-hover:opacity-100 transition-all duration-300" style={{ height: `${Math.max(pct, 4)}%` }} />
                      <p className="text-[9px] text-ink/35 font-medium">{month.split(' ')[0]}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-violet-500" /> Role Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {([['NURSE', 'bg-sky-500', 'text-sky-600', 'Registered Nurses'], ['EN', 'bg-violet-500', 'text-violet-600', 'Enrolled Nurses'], ['PCA', 'bg-amber-500', 'text-amber-600', 'Personal Care Assistants']] as const).map(([role, bar, txt, label]) => {
              const count = roleDistrib[role as keyof typeof roleDistrib]
              const pct = shifts.length > 0 ? (count / shifts.length) * 100 : 0
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-ink">{label}</span>
                    <span className={`font-mono font-bold text-xs ${txt}`}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-amber-500" /> Shift Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {[
              { label: 'Awaiting Staff', status: 'PENDING', bar: 'bg-amber-400' },
              { label: 'Confirmed', status: 'MATCHED', bar: 'bg-emerald-500' },
              { label: 'On Shift', status: 'CLOCKED_IN', bar: 'bg-blue-500' },
              { label: 'Completed', status: 'COMPLETED', bar: 'bg-emerald-500' },
              { label: 'Cancelled', status: 'CANCELLED', bar: 'bg-stone-300' },
            ].map(({ label, status, bar }) => {
              const count = shifts.filter(s => s.status === status).length
              const pct = shifts.length > 0 ? (count / shifts.length) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-medium text-ink text-sm">{label}</span>
                    <span className="font-mono font-bold text-xs text-ink/50">{count}</span>
                  </div>
                  <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Highly Rated Carers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {workers.filter(w => w.rating != null).length === 0 ? (
              <div className="text-center py-8">
                <XCircle className="w-7 h-7 text-ink/20 mx-auto mb-2" />
                <p className="text-ink/40 text-sm">No ratings yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-2">
                {workers.filter(w => w.rating != null).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5).map((w, i) => (
                  <div key={w.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors">
                    <span className="text-lg font-black font-mono text-ink/20 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm truncate">{w.name ?? w.email}</p>
                      <p className="text-xs text-ink/40">{w.role}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-black font-mono text-sm text-ink">{w.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
