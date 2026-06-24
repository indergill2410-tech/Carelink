import { redirect } from 'next/navigation'
import {
  FileCheck, CheckCircle, XCircle, AlertTriangle, ShieldCheck,
  Clock, ArrowUpRight, CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ComplianceBadge } from '@/components/StatusBadge'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { COMPLIANCE_DOCUMENTS } from '@/lib/compliance'
import { requireAdmin, getCertificationsData, getSidebarCounts, getFacilityOptions } from '../_data'
import { reviewDocument, toggleCompliance } from '../_actions'

export const dynamic = 'force-dynamic'

const DOC_LABEL: Record<string, string> = Object.fromEntries(
  COMPLIANCE_DOCUMENTS.map(d => [d.key, d.label]),
)
const labelFor = (t: string) => DOC_LABEL[t] ?? t.replace(/_/g, ' ')
const auDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })

function ExpiryChip({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-ink/35">No expiry</span>
  if (days < 0) return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 border border-rose-200">Expired {Math.abs(days)}d ago</span>
  if (days <= 30) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 border border-amber-200">Expires in {days}d</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 border border-emerald-200">Valid · {days}d</span>
}

export default async function CertificationsPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/login?error=Unauthorized')

  const [data, counts, facilities] = await Promise.all([
    getCertificationsData(), getSidebarCounts(), getFacilityOptions(),
  ])

  const verified = data.workers.filter(w => w.complianceStatus === 'GREEN')
  const atRisk = data.expired.length + data.expiringSoon.length
  const riskDocs = [...data.expired, ...data.expiringSoon] // expired first, then soonest expiring

  const kpis = [
    { label: 'Awaiting Review', value: data.pending.length, icon: FileCheck, accent: 'text-sage-600', bg: 'bg-sage-50 border-sage-200' },
    { label: 'Expiring ≤30 days', value: data.expiringSoon.length, icon: CalendarClock, accent: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Expired', value: data.expired.length, icon: AlertTriangle, accent: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
    { label: 'Verified Carers', value: verified.length, icon: ShieldCheck, accent: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  ]

  return (
    <DashboardShell title="Certifications & Compliance" eyebrow="Compliance" counts={counts} facilities={facilities}>
      {/* Risk banner */}
      {atRisk > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 flex items-start gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-black text-ink tracking-tight">Compliance at risk — {atRisk} document{atRisk === 1 ? '' : 's'} need attention</h3>
            <p className="text-sm text-ink/55 mt-0.5">
              {data.expired.length} expired and {data.expiringSoon.length} expiring within 30 days. Carers with expired certifications can&apos;t be matched to shifts.
            </p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`border rounded-2xl p-5 ${k.bg}`}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-label text-ink/45">{k.label}</p>
              <k.icon className={`w-4 h-4 ${k.accent} opacity-70`} />
            </div>
            <p className={`text-3xl font-black font-mono ${k.accent}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Documents awaiting review */}
      {data.pending.length > 0 && (
        <Card>
          <CardHeader className="border-b border-surface-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="w-4 h-4 text-sage-500" /> Documents Awaiting Review
              <span className="ml-1 bg-sage-100 text-sage-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">{data.pending.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-surface-2">
              {data.pending.map(doc => (
                <div key={doc.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-surface-1 transition-colors">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-ink text-sm">{doc.workerName}</p>
                    <p className="text-xs text-ink/45 mt-0.5">{doc.workerRole} · {labelFor(doc.docType)}{doc.expiresAt ? ` · expires ${auDate(doc.expiresAt)}` : ''}</p>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:underline mt-1 inline-flex items-center gap-0.5">
                        View document <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={reviewDocument}>
                      <input type="hidden" name="docId" value={doc.id} />
                      <input type="hidden" name="action" value="APPROVED" />
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-none text-xs h-8 gap-1"><CheckCircle className="w-3 h-3" /> Approve</Button>
                    </form>
                    <form action={reviewDocument}>
                      <input type="hidden" name="docId" value={doc.id} />
                      <input type="hidden" name="action" value="REJECTED" />
                      <Button size="sm" variant="destructive" className="text-xs h-8 gap-1"><XCircle className="w-3 h-3" /> Re-upload</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiry tracker */}
      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarClock className="w-4 h-4 text-amber-500" /> Expiry Tracker
            <span className="ml-1 text-xs font-medium text-ink/40">expired &amp; expiring soonest first</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {riskDocs.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink/55">No certifications expiring soon</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-2 bg-surface-1 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Carer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Document</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Expiry</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-2">
                  {riskDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-surface-1 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-ink">{doc.workerName}</p>
                        <p className="text-xs text-ink/40">{doc.workerRole}</p>
                      </td>
                      <td className="px-4 py-3.5 text-ink/70">{labelFor(doc.docType)}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-ink/55">{doc.expiresAt ? auDate(doc.expiresAt) : '—'}</td>
                      <td className="px-4 py-3.5"><ExpiryChip days={doc.daysLeft} /></td>
                      <td className="px-4 py-3.5 text-right">
                        <form action={reviewDocument} className="inline-block">
                          <input type="hidden" name="docId" value={doc.id} />
                          <input type="hidden" name="action" value="REJECTED" />
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 gap-1"><Clock className="w-3 h-3" /> Request renewal</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team readiness */}
      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">Team Readiness — {data.workers.length} carers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.workers.length === 0 ? (
            <p className="text-ink/40 text-center py-10 text-sm">No carers registered yet.</p>
          ) : (
            <div className="divide-y divide-surface-2">
              {[...data.workers].sort((a, b) => (a.complianceStatus === 'GREEN' ? 1 : 0) - (b.complianceStatus === 'GREEN' ? 1 : 0)).map(w => {
                const approved = w.documents.filter(d => d.status === 'APPROVED').length
                return (
                  <div key={w.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-1 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${w.complianceStatus === 'GREEN' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      {w.complianceStatus === 'GREEN' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm truncate">{w.name ?? '—'}</p>
                      <p className="text-xs text-ink/40">{w.email} · {w.role} · {approved}/{w.documents.length || 0} docs approved</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ComplianceBadge status={w.complianceStatus} />
                      <form action={toggleCompliance}>
                        <input type="hidden" name="workerId" value={w.id} />
                        <Button size="sm" variant="outline" type="submit" className="text-xs h-8 px-3">
                          {w.complianceStatus === 'GREEN' ? 'Flag for Review' : 'Clear for Work'}
                        </Button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
