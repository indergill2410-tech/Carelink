import { Users, Star, CheckCircle, XCircle, Mail, Phone } from 'lucide-react'
import { ComplianceBadge } from '@/components/StatusBadge'
import { FacilityShell } from '@/components/facility/FacilityShell'
import { getFacilityContext, getFacilityWorkers } from '../_data'
import { getComplianceStatusForDocuments } from '@/lib/compliance'

export const dynamic = 'force-dynamic'

const ROLE_META: Record<string, { label: string; color: string }> = {
  NURSE: { label: 'RN',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
  EN:    { label: 'EN',  color: 'bg-sage-100 text-sage-700 border-sage-200' },
  PCA:   { label: 'PCA', color: 'bg-clay-100 text-clay-700 border-clay-200' },
}

export default async function FacilityCareTeamPage() {
  const { facility, kpis } = await getFacilityContext()
  const workers = await getFacilityWorkers(facility.id)

  const nurses = workers.filter(w => w.role === 'NURSE')
  const ens    = workers.filter(w => w.role === 'EN')
  const pcas   = workers.filter(w => w.role === 'PCA')

  const roleGroups = [
    { label: 'Registered Nurses', short: 'RN', workers: nurses, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Enrolled Nurses', short: 'EN', workers: ens, color: 'text-sage-700', bg: 'bg-sage-50 border-sage-200' },
    { label: 'Personal Care Assistants', short: 'PCA', workers: pcas, color: 'text-clay-700', bg: 'bg-clay-50 border-clay-200' },
  ]

  return (
    <FacilityShell facility={facility} kpis={kpis}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-black text-ink text-xl tracking-tight">My Care Team</h1>
            <p className="text-sm text-ink/45 mt-0.5">Carers who have worked shifts at {facility.name}</p>
          </div>
        </div>

        {/* Role summary */}
        <div className="grid grid-cols-3 gap-4">
          {roleGroups.map(g => (
            <div key={g.short} className={`border rounded-2xl p-4 ${g.bg}`}>
              <p className={`text-3xl font-black font-mono ${g.color}`}>{g.workers.length}</p>
              <p className="text-xs font-semibold text-ink/50 mt-1">{g.label}</p>
            </div>
          ))}
        </div>

        {workers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-surface-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-ink/20" />
            </div>
            <p className="font-bold text-ink/50">No carers have worked here yet</p>
            <p className="text-ink/30 text-xs mt-1">Once carers complete shifts, they&apos;ll appear here</p>
          </div>
        ) : (
          roleGroups.map(g => {
            if (g.workers.length === 0) return null
            return (
              <div key={g.short} className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-ink/40">{g.label} · {g.workers.length}</h2>
                <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden divide-y divide-surface-2">
                  {g.workers.map(worker => {
                    const complianceStatus = getComplianceStatusForDocuments(worker.role, worker.documents)
                    const meta = ROLE_META[worker.role] ?? ROLE_META.PCA
                    const shiftsCompleted = worker.assignedShifts.length
                    return (
                      <div key={worker.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-1 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${meta.color}`}>
                          {(worker.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink text-sm">{worker.name ?? '—'}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink/40">
                            <a href={`mailto:${worker.email}`} className="inline-flex items-center gap-0.5 hover:text-teal"><Mail className="w-3 h-3" />{worker.email}</a>
                            {worker.phone && <a href={`tel:${worker.phone}`} className="inline-flex items-center gap-0.5 hover:text-teal"><Phone className="w-3 h-3" />{worker.phone}</a>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {worker.rating != null && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {worker.rating.toFixed(1)}
                            </div>
                          )}
                          <div className="text-center hidden sm:block">
                            <p className="text-sm font-black font-mono text-ink">{shiftsCompleted}</p>
                            <p className="text-[10px] text-ink/35">shifts</p>
                          </div>
                          <ComplianceBadge status={complianceStatus} />
                          {complianceStatus === 'GREEN'
                            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                            : <XCircle className="w-4 h-4 text-rose-500" />
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </FacilityShell>
  )
}
