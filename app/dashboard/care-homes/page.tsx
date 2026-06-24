import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { requireAdmin, getCareHomesData, getSidebarCounts, getFacilityOptions } from '../_data'
import { saveFacility, assignFacilityManager } from '../_actions'

export const dynamic = 'force-dynamic'

export default async function CareHomesPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/login?error=Unauthorized')

  const [data, counts, facilityOptions] = await Promise.all([
    getCareHomesData(), getSidebarCounts(), getFacilityOptions(),
  ])
  const { facilities, shifts, facilityManagers } = data

  const totalOpen = shifts.filter(s => s.status === 'PENDING').length
  const totalFilled = shifts.filter(s => ['MATCHED', 'CLOCKED_IN', 'COMPLETED'].includes(s.status)).length
  const fillRate = totalOpen + totalFilled > 0 ? Math.round((totalFilled / (totalOpen + totalFilled)) * 100) : 0

  const summary = [
    { label: 'Care Homes', value: facilities.length },
    { label: 'Open Shifts', value: totalOpen },
    { label: 'Filled Shifts', value: totalFilled },
    { label: 'Fill Rate', value: `${fillRate}%` },
  ]

  return (
    <DashboardShell title="Care Homes" eyebrow="People" counts={counts} facilities={facilityOptions}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map(s => (
          <Card key={s.label} className="hover:shadow-card-hover transition-shadow duration-300">
            <CardContent className="p-5">
              <p className="text-label text-ink/40 mb-2">{s.label}</p>
              <p className="text-3xl font-black font-mono text-ink">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">Add Care Home</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form action={saveFacility} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input name="name" placeholder="Facility name" required className="h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <input name="address" placeholder="Address" required className="md:col-span-2 h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <input name="phone" placeholder="Phone" className="h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <Button type="submit" className="h-10">Add Care Home</Button>
            <input name="email" type="email" placeholder="Email" className="md:col-span-2 h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
            <input name="defaultRate" type="number" min="0" max="500" step="0.50" placeholder="Default rate" className="h-10 rounded-xl border border-surface-3 px-3 text-sm text-ink focus:border-teal focus:outline-none" />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">All Care Homes — {facilities.length}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {facilities.length === 0 ? (
            <p className="text-ink/40 text-center py-10 text-sm">No care homes added yet.</p>
          ) : (
            <div className="divide-y divide-surface-2">
              {facilities.map(f => {
                const fs = shifts.filter(s => s.facilityId === f.id)
                const active = fs.filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status)).length
                const pending = fs.filter(s => s.status === 'PENDING').length
                const completed = fs.filter(s => s.status === 'COMPLETED').length

                return (
                  <div key={f.id} className="px-5 py-4 hover:bg-surface-1 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink">{f.name}</p>
                        <p className="text-xs text-ink/40 truncate">{f.address}</p>
                        <p className="text-[11px] text-ink/35 truncate">
                          {f.managers.length > 0 ? f.managers.map(m => m.name ?? m.email).join(', ') : 'No manager assigned'}
                        </p>
                      </div>
                      <div className="flex gap-5 text-center shrink-0">
                        {[
                          { v: active, l: 'On Shift', c: 'text-teal' },
                          { v: pending, l: 'Awaiting', c: 'text-amber-600' },
                          { v: completed, l: 'Done', c: 'text-emerald-600' },
                        ].map(item => (
                          <div key={item.l}>
                            <p className={`font-black font-mono text-sm ${item.c}`}>{item.v}</p>
                            <p className="text-[10px] text-ink/35 font-medium">{item.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-bold text-teal">Manage facility</summary>
                      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <form action={saveFacility} className="rounded-2xl border border-surface-2 bg-surface-0 p-4 space-y-3">
                          <input type="hidden" name="facilityId" value={f.id} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input name="name" defaultValue={f.name} required className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                            <input name="phone" defaultValue={f.phone ?? ''} placeholder="Phone" className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                          </div>
                          <input name="address" defaultValue={f.address} required className="h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input name="email" type="email" defaultValue={f.email ?? ''} placeholder="Email" className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                            <input name="defaultRate" type="number" min="0" max="500" step="0.50" defaultValue={f.defaultRate ? Number(f.defaultRate).toFixed(2) : ''} placeholder="Default rate" className="h-9 rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                          </div>
                          <Button size="sm" type="submit" className="h-9 w-full text-xs">Save Facility</Button>
                        </form>

                        <form action={assignFacilityManager} className="rounded-2xl border border-surface-2 bg-surface-0 p-4 space-y-3">
                          <input type="hidden" name="facilityId" value={f.id} />
                          <div>
                            <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Assign manager</label>
                            <select name="managerId" className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" required>
                              <option value="">Select a facility manager...</option>
                              {facilityManagers.map(manager => (
                                <option key={manager.id} value={manager.id}>{manager.name ?? manager.email}{manager.facilityId === f.id ? ' (current)' : ''}</option>
                              ))}
                            </select>
                          </div>
                          <Button size="sm" type="submit" className="h-9 w-full text-xs">Assign Manager</Button>
                          <div className="rounded-xl bg-surface-1 p-3">
                            <p className="text-[10px] font-bold text-ink/35 uppercase tracking-wider mb-1">Current managers</p>
                            {f.managers.length === 0 ? (
                              <p className="text-xs text-ink/35">None assigned</p>
                            ) : (
                              <div className="space-y-1">
                                {f.managers.map(manager => (
                                  <p key={manager.id} className="text-xs text-ink/55 truncate">{manager.name ?? manager.email}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </form>
                      </div>
                    </details>
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
