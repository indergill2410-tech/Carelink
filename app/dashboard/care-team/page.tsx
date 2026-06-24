import { redirect } from 'next/navigation'
import { Users, Star, UserCog, Power, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ComplianceBadge } from '@/components/StatusBadge'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { requireAdmin, getCareTeamData, getSidebarCounts, getFacilityOptions } from '../_data'
import { toggleCompliance, toggleWorkerActive, updateWorkerProfile } from '../_actions'

export const dynamic = 'force-dynamic'

const ROLE_CARDS = [
  { role: 'NURSE' as const, label: 'Registered Nurses', bg: 'bg-sky-100', icon: 'text-sky-600' },
  { role: 'EN' as const, label: 'Enrolled Nurses', bg: 'bg-violet-100', icon: 'text-violet-600' },
  { role: 'PCA' as const, label: 'Personal Care Assistants', bg: 'bg-amber-100', icon: 'text-amber-600' },
]

export default async function CareTeamPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/login?error=Unauthorized')

  const [data, counts, facilities] = await Promise.all([
    getCareTeamData(), getSidebarCounts(), getFacilityOptions(),
  ])
  const { workers } = data
  const byRole = {
    NURSE: workers.filter(w => w.role === 'NURSE'),
    EN: workers.filter(w => w.role === 'EN'),
    PCA: workers.filter(w => w.role === 'PCA'),
  }
  const activeCount = workers.filter(w => w.isActive).length

  return (
    <DashboardShell title="Care Team" eyebrow="People" counts={counts} facilities={facilities}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_CARDS.map(({ role, label, bg, icon }) => (
          <Card key={role} className="hover:shadow-card-hover transition-shadow duration-300">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${bg}`}>
                <Users className={`w-5 h-5 ${icon}`} />
              </div>
              <p className="text-3xl font-black font-mono text-ink">{byRole[role].length}</p>
              <p className="text-sm text-ink/50 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-emerald-100">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black font-mono text-ink">{activeCount}</p>
            <p className="text-sm text-ink/50 mt-1">Active right now</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-surface-2">
          <CardTitle className="text-sm">All Care Team Members — {workers.length}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workers.length === 0 ? (
            <p className="text-ink/40 text-center py-10 text-sm">No carers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-2 bg-surface-1 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Verification</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Shifts</th>
                    <th className="px-4 py-3 text-xs font-semibold text-ink/40 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-2">
                  {workers.map(w => (
                    <tr key={w.id} className={`hover:bg-surface-1 transition-colors ${!w.isActive ? 'opacity-45' : ''}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-ink">{w.name ?? '—'}</p>
                        <p className="text-xs text-ink/40">{w.email}</p>
                        {w.rating != null && (
                          <p className="text-xs text-amber-500 flex items-center gap-0.5 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400" /> {w.rating.toFixed(1)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded-md text-xs font-bold bg-ink/8 text-ink">{w.role}</span></td>
                      <td className="px-4 py-3.5"><ComplianceBadge status={w.complianceStatus} /></td>
                      <td className="px-4 py-3.5 font-mono text-xs text-ink/60">{w.completedShifts}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${w.isActive ? 'bg-teal/10 text-teal' : 'bg-surface-2 text-ink/40'}`}>
                          {w.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5 justify-end">
                          <details className="relative">
                            <summary className="list-none">
                              <Button size="sm" variant="outline" type="button" className="text-xs h-7 px-2.5 gap-1 cursor-pointer"><UserCog className="w-3 h-3" /> Edit</Button>
                            </summary>
                            <div className="absolute right-0 top-9 z-30 w-80 rounded-2xl border border-surface-2 bg-surface-0 p-4 shadow-modal">
                              <form action={updateWorkerProfile} className="space-y-3">
                                <input type="hidden" name="workerId" value={w.id} />
                                <div>
                                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Name</label>
                                  <input name="name" defaultValue={w.name ?? ''} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Phone</label>
                                  <input name="phone" defaultValue={w.phone ?? ''} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-3 text-xs text-ink focus:border-teal focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Role</label>
                                    <select name="role" defaultValue={w.role} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-2 text-xs text-ink focus:border-teal focus:outline-none">
                                      <option value="NURSE">Registered Nurse</option>
                                      <option value="EN">Enrolled Nurse</option>
                                      <option value="PCA">Personal Care Assistant</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Account</label>
                                    <select name="status" defaultValue={w.status} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-2 text-xs text-ink focus:border-teal focus:outline-none">
                                      <option value="ACTIVE">Active</option>
                                      <option value="PENDING">Pending</option>
                                      <option value="BLOCKED">Blocked</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Verification</label>
                                  <select name="complianceStatus" defaultValue={w.complianceStatus ?? 'RED'} className="mt-1 h-9 w-full rounded-xl border border-surface-3 px-2 text-xs text-ink focus:border-teal focus:outline-none">
                                    <option value="GREEN">Verified</option>
                                    <option value="AMBER">In Review</option>
                                    <option value="RED">Incomplete</option>
                                  </select>
                                </div>
                                <Button size="sm" type="submit" className="h-9 w-full text-xs">Save</Button>
                              </form>
                            </div>
                          </details>
                          <form action={toggleCompliance}>
                            <input type="hidden" name="workerId" value={w.id} />
                            <Button size="sm" variant="outline" type="submit" className="text-xs h-7 px-2.5 gap-1"><UserCog className="w-3 h-3" /> {w.complianceStatus === 'GREEN' ? 'Flag' : 'Clear'}</Button>
                          </form>
                          <form action={toggleWorkerActive}>
                            <input type="hidden" name="workerId" value={w.id} />
                            <Button size="sm" variant="outline" type="submit" className={`text-xs h-7 px-2.5 gap-1 ${w.isActive ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                              <Power className="w-3 h-3" /> {w.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
