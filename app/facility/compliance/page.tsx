import { ShieldCheck, AlertTriangle, CheckCircle, Clock, CalendarClock } from 'lucide-react'
import { FacilityShell } from '@/components/facility/FacilityShell'
import { getFacilityContext, getFacilityComplianceDocs } from '../_data'
import { getDaysUntilExpiry, COMPLIANCE_DOCUMENTS } from '@/lib/compliance'

export const dynamic = 'force-dynamic'

const DOC_LABEL: Record<string, string> = Object.fromEntries(COMPLIANCE_DOCUMENTS.map(d => [d.key, d.label]))
const labelFor = (t: string) => DOC_LABEL[t] ?? t.replace(/_/g, ' ')
const auDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })

function ExpiryChip({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-ink/35">No expiry</span>
  if (days < 0) return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 border border-rose-200">Expired {Math.abs(days)}d ago</span>
  if (days <= 30) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 border border-amber-200">Expires in {days}d</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 border border-emerald-200">Valid · {days}d left</span>
}

export default async function FacilityCompliancePage() {
  const { facility, kpis } = await getFacilityContext()
  const docs = await getFacilityComplianceDocs(facility.id)
  const now = new Date()

  const expired    = docs.filter(d => d.expiresAt && getDaysUntilExpiry(d.expiresAt, now)! < 0)
  const expiringSoon = docs.filter(d => d.expiresAt && getDaysUntilExpiry(d.expiresAt, now) !== null && getDaysUntilExpiry(d.expiresAt, now)! >= 0 && getDaysUntilExpiry(d.expiresAt, now)! <= 30)
  const pending    = docs.filter(d => d.status === 'PENDING')
  const approved   = docs.filter(d => d.status === 'APPROVED' && (d.expiresAt == null || getDaysUntilExpiry(d.expiresAt, now)! > 30))

  const atRisk = expired.length + expiringSoon.length

  const kpiItems = [
    { label: 'Approved', value: approved.length, icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200', accent: 'text-emerald-700' },
    { label: 'Awaiting Review', value: pending.length, icon: Clock, bg: 'bg-blue-50 border-blue-200', accent: 'text-blue-700' },
    { label: 'Expiring ≤30d', value: expiringSoon.length, icon: CalendarClock, bg: 'bg-amber-50 border-amber-200', accent: 'text-amber-700' },
    { label: 'Expired', value: expired.length, icon: AlertTriangle, bg: 'bg-rose-50 border-rose-200', accent: 'text-rose-700' },
  ]

  return (
    <FacilityShell facility={facility} kpis={kpis}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-black text-ink text-xl tracking-tight">Compliance</h1>
            <p className="text-sm text-ink/45 mt-0.5">Certification status for carers at {facility.name}</p>
          </div>
        </div>

        {atRisk > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-ink tracking-tight">{atRisk} document{atRisk === 1 ? '' : 's'} need attention</p>
              <p className="text-sm text-ink/55 mt-0.5">{expired.length} expired · {expiringSoon.length} expiring within 30 days. Carers with expired certs can&apos;t be matched to shifts.</p>
            </div>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpiItems.map(k => (
            <div key={k.label} className={`border rounded-2xl p-4 ${k.bg}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-label text-ink/45">{k.label}</p>
                <k.icon className={`w-4 h-4 ${k.accent} opacity-70`} />
              </div>
              <p className={`text-3xl font-black font-mono ${k.accent}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-surface-3">
            <ShieldCheck className="w-10 h-10 text-ink/20 mx-auto mb-4" />
            <p className="font-bold text-ink/50">No compliance documents yet</p>
            <p className="text-ink/30 text-xs mt-1">Documents are uploaded by carers who have worked at this facility</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-2">
              <p className="text-sm font-bold text-ink">All Documents · {docs.length}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-2 bg-surface-1 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Carer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Document</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Expiry</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-2">
                  {[...expired, ...expiringSoon, ...pending, ...approved].map(doc => {
                    const days = doc.expiresAt ? getDaysUntilExpiry(doc.expiresAt, now) : null
                    return (
                      <tr key={doc.id} className="hover:bg-surface-1 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-ink">{doc.user.name ?? '—'}</p>
                          <p className="text-xs text-ink/40">{doc.user.role}</p>
                        </td>
                        <td className="px-4 py-3.5 text-ink/70">{labelFor(doc.docType)}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-ink/55">{doc.expiresAt ? auDate(doc.expiresAt) : '—'}</td>
                        <td className="px-4 py-3.5"><ExpiryChip days={days} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </FacilityShell>
  )
}
