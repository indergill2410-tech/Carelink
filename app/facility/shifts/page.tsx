import { Radio, Zap, CheckCircle2, Clock, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { FacilityShell } from '@/components/facility/FacilityShell'
import { getFacilityContext, getFacilityShifts } from '../_data'
import { cancelShift } from '../_actions'

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

const STATUS_ORDER = ['CLOCKED_IN', 'MATCHED', 'PENDING', 'COMPLETED', 'CANCELLED']

export default async function LiveShiftBoardPage() {
  const { facility, kpis } = await getFacilityContext()
  const allShifts = await getFacilityShifts(facility.id)

  // Show upcoming + active shifts (next 7 days), then recent completed
  const now = new Date()
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const liveShifts = allShifts
    .filter(s => s.status !== 'CANCELLED' && (s.status !== 'COMPLETED' || s.endTime >= new Date(now.getTime() - 24 * 60 * 60 * 1000)))
    .filter(s => s.startTime <= next7)
    .sort((a, b) => {
      const orderA = STATUS_ORDER.indexOf(a.status)
      const orderB = STATUS_ORDER.indexOf(b.status)
      if (orderA !== orderB) return orderA - orderB
      return a.startTime.getTime() - b.startTime.getTime()
    })

  const groups = {
    'On Shift Now': liveShifts.filter(s => s.status === 'CLOCKED_IN'),
    'Confirmed — Starting Soon': liveShifts.filter(s => s.status === 'MATCHED'),
    'Awaiting Match': liveShifts.filter(s => s.status === 'PENDING'),
    'Recently Completed': liveShifts.filter(s => s.status === 'COMPLETED'),
  }

  return (
    <FacilityShell facility={facility} kpis={kpis}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-center">
            <Radio className="w-5 h-5 text-sage-600" />
          </div>
          <div>
            <h1 className="font-black text-ink text-xl tracking-tight">Live Shift Board</h1>
            <p className="text-sm text-ink/45 mt-0.5">Next 7 days · updates on page refresh</p>
          </div>
        </div>

        {liveShifts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-surface-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
              <Radio className="w-7 h-7 text-ink/20" />
            </div>
            <p className="font-bold text-ink/50">No active shifts in the next 7 days</p>
            <p className="text-ink/30 text-xs mt-1">Request staff from the &ldquo;Request Staff&rdquo; tab</p>
          </div>
        ) : (
          Object.entries(groups).map(([groupLabel, groupShifts]) => {
            if (groupShifts.length === 0) return null
            return (
              <div key={groupLabel} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-ink/40">{groupLabel}</h2>
                  <span className="bg-surface-2 text-ink/40 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{groupShifts.length}</span>
                  {groupLabel === 'On Shift Now' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-sage-600 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
                      <span className="w-1.5 h-1.5 bg-sage-500 rounded-full animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {groupShifts.map(shift => {
                    const meta = ROLE_META[shift.role] ?? ROLE_META.PCA
                    const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3600000
                    return (
                      <div key={shift.id} className="group flex items-center gap-0 bg-white rounded-2xl border border-surface-2 shadow-card hover:shadow-card-hover transition-all duration-[220ms] overflow-hidden">
                        <div className={`w-1 self-stretch shrink-0 ${STATUS_BAR[shift.status] ?? 'bg-stone-300'}`} />
                        <div className="flex items-center gap-4 px-4 py-3.5 flex-1 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs border shrink-0 ${meta.color}`}>
                            {meta.label}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-ink text-sm">
                                {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Australia/Melbourne' })}
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
                              <div className="mt-0.5">
                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />{shift.worker.name ?? shift.worker.email}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-ink/40 mt-0.5">
                                  <a href={`mailto:${shift.worker.email}`} className="inline-flex items-center gap-1 hover:text-teal"><Mail className="w-3 h-3" /> Email</a>
                                  {shift.worker.phone && <a href={`tel:${shift.worker.phone}`} className="inline-flex items-center gap-1 hover:text-teal"><Phone className="w-3 h-3" /> Phone</a>}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Matching in progress…
                              </p>
                            )}
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
