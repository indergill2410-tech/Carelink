import { CreditCard, FileText, Download, Clock } from 'lucide-react'
import { FacilityShell } from '@/components/facility/FacilityShell'
import { getFacilityContext, getFacilityShifts } from '../_data'

export const dynamic = 'force-dynamic'

const auDate = (d: Date) =>
  d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })

export default async function FacilityBillingPage() {
  const { facility, kpis } = await getFacilityContext()
  const shifts = await getFacilityShifts(facility.id)

  const completed = shifts.filter(s => s.status === 'COMPLETED')
  const totalHours = completed.reduce((sum, s) => sum + Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3600000), 0)

  // Group completed shifts by month for billing summary
  const byMonth = new Map<string, { hours: number; count: number; month: string; year: number }>()
  for (const s of completed) {
    const d = s.startTime
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne' })
    const hrs = Math.max(0, (s.endTime.getTime() - s.startTime.getTime()) / 3600000)
    const existing = byMonth.get(key)
    if (existing) {
      existing.hours += hrs
      existing.count++
    } else {
      byMonth.set(key, { hours: hrs, count: 1, month: label, year: d.getUTCFullYear() })
    }
  }

  const monthlyRows = Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)

  return (
    <FacilityShell facility={facility} kpis={kpis}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="font-black text-ink text-xl tracking-tight">Billing</h1>
            <p className="text-sm text-ink/45 mt-0.5">Invoice summary and care hours for {facility.name}</p>
          </div>
        </div>

        {/* Coming-soon banner */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 flex items-start gap-4">
          <Clock className="w-6 h-6 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-ink tracking-tight">Full invoicing coming soon</p>
            <p className="text-sm text-ink/55 mt-0.5">Automated tax invoices, timesheet exports, and direct payment processing are in development. In the meantime, here&apos;s your care hours summary.</p>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-surface-2 rounded-2xl p-5 shadow-card">
            <p className="text-label text-ink/40 mb-2">Total Care Hours</p>
            <p className="text-3xl font-black font-mono text-sky-700">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white border border-surface-2 rounded-2xl p-5 shadow-card">
            <p className="text-label text-ink/40 mb-2">Completed Shifts</p>
            <p className="text-3xl font-black font-mono text-emerald-700">{completed.length}</p>
          </div>
          <div className="bg-white border border-surface-2 rounded-2xl p-5 shadow-card col-span-2 sm:col-span-1">
            <p className="text-label text-ink/40 mb-2">Award Wages</p>
            <p className="text-sm font-semibold text-ink/60 mt-1">All rates comply with the Aged Care Award 2010. Invoices reflect agreed costing rates.</p>
          </div>
        </div>

        {/* Monthly care hours table */}
        {monthlyRows.length > 0 ? (
          <div className="bg-white border border-surface-2 rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-ink/40" />
                <p className="font-bold text-ink text-sm">Monthly Hours Summary</p>
              </div>
              <span className="text-xs text-ink/35 font-medium">Last 12 months</span>
            </div>
            <div className="divide-y divide-surface-2">
              {monthlyRows.map(([key, row]) => (
                <div key={key} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-ink text-sm">{row.month}</p>
                    <p className="text-xs text-ink/40 mt-0.5">{row.count} shift{row.count !== 1 ? 's' : ''} completed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black font-mono text-ink text-base">{row.hours.toFixed(1)}h</p>
                    <p className="text-xs text-ink/35 mt-0.5">care hours</p>
                  </div>
                  <button
                    disabled
                    className="flex items-center gap-1.5 text-xs font-semibold text-ink/25 px-3 py-1.5 rounded-lg border border-surface-2 cursor-not-allowed"
                    title="Invoice export coming soon"
                  >
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-surface-3">
            <CreditCard className="w-10 h-10 text-ink/20 mx-auto mb-4" />
            <p className="font-bold text-ink/50">No billing data yet</p>
            <p className="text-ink/30 text-xs mt-1">Monthly summaries appear once shifts are completed</p>
          </div>
        )}
      </div>
    </FacilityShell>
  )
}
