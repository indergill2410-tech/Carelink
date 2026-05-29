import {
  Activity, Clock, FileWarning, Users, X, Building2,
  CheckCircle, XCircle, LayoutDashboard, TrendingUp,
  BarChart3, Star, UserCog, Power, FileCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { signOut } from '@/app/login/actions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

// ─── Server actions ─────────────────────────────────────────────────────────

async function broadcastShift(formData: FormData) {
  'use server'
  const facilityId = formData.get('facilityId') as string
  const role = formData.get('role') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const hourlyRate = parseFloat(formData.get('hourlyRate') as string)
  const notes = (formData.get('notes') as string) || null
  const urgent = formData.get('urgent') === 'on'

  const parseMelbourneTime = (s: string) => {
    const d = new Date(s.includes('Z') ? s : `${s}Z`)
    if (isNaN(d.getTime())) return new Date(s)
    const tz = d.toLocaleString('en-US', { timeZone: 'Australia/Melbourne' })
    return new Date(d.getTime() + (d.getTime() - new Date(tz).getTime()))
  }

  const start = parseMelbourneTime(startTime)
  const end = parseMelbourneTime(endTime)

  if (!facilityId || !role || isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end || isNaN(hourlyRate)) {
    redirect('/dashboard?broadcast=1&error=Invalid+shift+details')
  }

  await prisma.shift.create({
    data: {
      facilityId,
      role: role as Role,
      status: 'PENDING',
      startTime: start,
      endTime: end,
      hourlyRate,
      notes,
      urgent,
    },
  })

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

async function toggleCompliance(formData: FormData) {
  'use server'
  const workerId = formData.get('workerId') as string
  if (!workerId) return
  const worker = await prisma.user.findUnique({ where: { id: workerId } })
  if (!worker) return
  const newStatus = worker.complianceStatus === 'GREEN' ? 'RED' : 'GREEN'
  await prisma.user.update({ where: { id: workerId }, data: { complianceStatus: newStatus } })
  revalidatePath('/dashboard')
}

async function cancelShift(formData: FormData) {
  'use server'
  const shiftId = formData.get('shiftId') as string
  if (!shiftId) return
  await prisma.shift.update({ where: { id: shiftId }, data: { status: 'CANCELLED' } })
  revalidatePath('/dashboard')
}

async function toggleWorkerActive(formData: FormData) {
  'use server'
  const workerId = formData.get('workerId') as string
  if (!workerId) return
  const worker = await prisma.user.findUnique({ where: { id: workerId } })
  if (!worker) return
  await prisma.user.update({ where: { id: workerId }, data: { isActive: !worker.isActive } })
  revalidatePath('/dashboard')
}

async function reviewDocument(formData: FormData) {
  'use server'
  const docId = formData.get('docId') as string
  const action = formData.get('action') as 'APPROVED' | 'REJECTED'
  const reviewNote = (formData.get('reviewNote') as string) || null
  if (!docId || !['APPROVED', 'REJECTED'].includes(action)) return

  await prisma.complianceDocument.update({
    where: { id: docId },
    data: { status: action, reviewNote },
  })

  // Recompute compliance for the user
  const doc = await prisma.complianceDocument.findUnique({ where: { id: docId } })
  if (doc) {
    const required = ['POLICE_CHECK', 'WORKING_WITH_CHILDREN', 'FIRST_AID', 'IMMUNISATION', 'ID_PROOF']
    const approvedDocs = await prisma.complianceDocument.findMany({
      where: { userId: doc.userId, status: 'APPROVED', docType: { in: required } },
    })
    const newStatus = approvedDocs.length >= required.length ? 'GREEN' : 'RED'
    await prisma.user.update({ where: { id: doc.userId }, data: { complianceStatus: newStatus } })
  }

  revalidatePath('/dashboard')
}

// ─── Data fetcher ────────────────────────────────────────────────────────────

async function getDashboardData() {
  const [shifts, workers, facilitiesList, pendingDocs] = await Promise.all([
    prisma.shift.findMany({
      include: { facility: true, worker: true },
      orderBy: { startTime: 'desc' },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: { in: ['NURSE', 'EN', 'PCA'] } },
      orderBy: { name: 'asc' },
    }),
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
    prisma.complianceDocument.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const activeShifts = shifts.filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status))
  const unfilledShifts = shifts.filter(s => s.status === 'PENDING')
  const completedShifts = shifts.filter(s => s.status === 'COMPLETED')
  const complianceAlerts = workers.filter(w => w.complianceStatus === 'RED' || w.complianceStatus === 'AMBER')

  const totalRevenue = completedShifts.reduce((sum, s) => {
    const hrs = (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000
    return sum + s.hourlyRate * hrs
  }, 0)

  // Monthly stats for analytics
  const monthlyMap: Record<string, { revenue: number; shifts: number }> = {}
  for (const s of completedShifts) {
    const key = s.startTime.toLocaleDateString('en-AU', { month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })
    if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, shifts: 0 }
    const hrs = (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000
    monthlyMap[key].revenue += s.hourlyRate * hrs
    monthlyMap[key].shifts += 1
  }
  const monthlyData = Object.entries(monthlyMap).slice(-6).reverse()

  return {
    shifts, workers, activeShifts, unfilledShifts, completedShifts, complianceAlerts,
    facilities: facilitiesList, totalRevenue, monthlyData, pendingDocs,
  }
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Dispatch Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.shifts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl">
                No shifts yet. Broadcast a shift to get started.
              </div>
            ) : (
              data.shifts.slice(0, 12).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50 hover:bg-white transition-colors">
                  <div className="flex gap-3 items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      s.urgent ? 'bg-red-100 text-red-700' : 'bg-white border text-navy'
                    }`}>{s.role}</div>
                    <div>
                      <p className="font-semibold text-navy text-sm">{s.facility.name}</p>
                      <p className="text-xs text-gray-500">
                        {s.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                        {' · '}{s.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                        {' – '}{s.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                        {' · '}{s.worker ? s.worker.name ?? s.worker.email : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.urgent && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">URGENT</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      s.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      s.status === 'MATCHED' ? 'bg-teal-100 text-teal-800' :
                      s.status === 'CLOCKED_IN' ? 'bg-blue-100 text-blue-800' :
                      s.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>{s.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Urgent Action Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.unfilledShifts.slice(0, 4).map(s => (
            <div key={s.id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                {s.urgent && <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded">URGENT</span>}
                <p className="font-bold text-red-900 text-sm">{s.role} Shift</p>
              </div>
              <p className="text-red-700 text-xs mb-3">{s.facility.name} · Unfilled</p>
              <form action={cancelShift}>
                <input type="hidden" name="shiftId" value={s.id} />
                <Button size="sm" variant="destructive" className="w-full text-xs" type="submit">Override / Cancel</Button>
              </form>
            </div>
          ))}
          {data.complianceAlerts.slice(0, 3).map(w => (
            <div key={w.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="font-bold text-amber-900 text-sm">Compliance Review</p>
              <p className="text-amber-700 text-xs mt-1 mb-3">{w.name ?? w.email} · {w.complianceStatus}</p>
              <form action={toggleCompliance}>
                <input type="hidden" name="workerId" value={w.id} />
                <Button size="sm" variant="outline" className="w-full bg-white text-amber-900 border-amber-200 text-xs" type="submit">
                  {w.complianceStatus === 'GREEN' ? 'Mark RED' : 'Mark GREEN'}
                </Button>
              </form>
            </div>
          ))}
          {data.unfilledShifts.length === 0 && data.complianceAlerts.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">All caught up!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ComplianceTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { workers, pendingDocs } = data
  const green = workers.filter(w => w.complianceStatus === 'GREEN')
  const nonGreen = workers.filter(w => w.complianceStatus !== 'GREEN')

  return (
    <div className="space-y-8">
      {/* Document Review Queue */}
      {pendingDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-500" />
              Pending Document Reviews ({pendingDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDocs.map(doc => (
                <div key={doc.id} className="p-4 border border-blue-100 bg-blue-50/30 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-navy text-sm">{doc.user.name ?? doc.user.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.user.role} · {doc.docType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Uploaded {doc.createdAt.toLocaleDateString('en-AU')}
                      </p>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal underline mt-1 inline-block">
                          View Document
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <form action={reviewDocument}>
                        <input type="hidden" name="docId" value={doc.id} />
                        <input type="hidden" name="action" value="APPROVED" />
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs gap-1">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </Button>
                      </form>
                      <form action={reviewDocument}>
                        <input type="hidden" name="docId" value={doc.id} />
                        <input type="hidden" name="action" value="REJECTED" />
                        <Button size="sm" variant="destructive" className="text-xs gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{green.length}</p>
          <p className="text-sm text-green-600">Compliant</p>
        </div>
        <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{nonGreen.length}</p>
          <p className="text-sm text-red-600">Require Review</p>
        </div>
        <div className="flex-1 bg-gray-50 border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{workers.length}</p>
          <p className="text-sm text-gray-600">Total Workers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No workers registered yet.</p>
          ) : (
            <div className="space-y-2">
              {[...nonGreen, ...green].map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      w.complianceStatus === 'GREEN' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {w.complianceStatus === 'GREEN'
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        : <XCircle className="w-3.5 h-3.5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm">{w.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{w.email} · {w.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      w.complianceStatus === 'GREEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {w.complianceStatus}
                    </span>
                    <form action={toggleCompliance}>
                      <input type="hidden" name="workerId" value={w.id} />
                      <Button size="sm" variant="outline" type="submit" className="text-xs">
                        {w.complianceStatus === 'GREEN' ? 'Mark RED' : 'Mark GREEN'}
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WorkforceTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { workers } = data
  const byRole = {
    NURSE: workers.filter(w => w.role === 'NURSE'),
    EN: workers.filter(w => w.role === 'EN'),
    PCA: workers.filter(w => w.role === 'PCA'),
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {(['NURSE', 'EN', 'PCA'] as const).map(role => (
          <div key={role} className="bg-white border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-navy">{byRole[role].length}</p>
            <p className="text-sm text-gray-500">
              {role === 'NURSE' ? 'Registered Nurses' : role === 'EN' ? 'Enrolled Nurses' : 'PCAs'}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workers ({workers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No workers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Compliance</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workers.map(w => (
                    <tr key={w.id} className={`hover:bg-gray-50 ${!w.isActive ? 'opacity-50' : ''}`}>
                      <td className="py-3">
                        <p className="font-medium text-navy">{w.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{w.email}</p>
                        {w.rating && (
                          <p className="text-xs text-amber-500 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" /> {w.rating.toFixed(1)}
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-navy/10 text-navy">{w.role}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          w.complianceStatus === 'GREEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {w.complianceStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          w.isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {w.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <form action={toggleCompliance}>
                            <input type="hidden" name="workerId" value={w.id} />
                            <Button size="sm" variant="outline" type="submit" className="text-xs gap-1">
                              <UserCog className="w-3 h-3" />
                              {w.complianceStatus === 'GREEN' ? 'Mark RED' : 'Mark GREEN'}
                            </Button>
                          </form>
                          <form action={toggleWorkerActive}>
                            <input type="hidden" name="workerId" value={w.id} />
                            <Button size="sm" variant="outline" type="submit" className={`text-xs gap-1 ${w.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
                              <Power className="w-3 h-3" />
                              {w.isActive ? 'Deactivate' : 'Activate'}
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
    </div>
  )
}

function FacilitiesTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { facilities, shifts } = data
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Facilities ({facilities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {facilities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No facilities registered yet.</p>
          ) : (
            <div className="space-y-3">
              {facilities.map(f => {
                const fs = shifts.filter(s => s.facilityId === f.id)
                const active = fs.filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status)).length
                const pending = fs.filter(s => s.status === 'PENDING').length
                const completed = fs.filter(s => s.status === 'COMPLETED').length
                const spend = fs
                  .filter(s => s.status === 'COMPLETED')
                  .reduce((sum, s) => sum + s.hourlyRate * (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000, 0)

                return (
                  <div key={f.id} className="p-4 border rounded-xl hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy">{f.name}</p>
                          <p className="text-xs text-gray-500">{f.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-right text-sm">
                        <div>
                          <p className="font-bold text-teal-600">{active}</p>
                          <p className="text-xs text-gray-500">Active</p>
                        </div>
                        <div>
                          <p className="font-bold text-amber-600">{pending}</p>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                        <div>
                          <p className="font-bold text-green-600">{completed}</p>
                          <p className="text-xs text-gray-500">Done</p>
                        </div>
                        <div>
                          <p className="font-bold text-navy">${spend.toFixed(0)}</p>
                          <p className="text-xs text-gray-500">Spend</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const { shifts, workers, monthlyData } = data
  const completed = shifts.filter(s => s.status === 'COMPLETED')
  const fillRate = shifts.length > 0
    ? Math.round((completed.length / shifts.length) * 100)
    : 0
  const avgHoursPerShift = completed.length > 0
    ? completed.reduce((s, x) => s + (x.endTime.getTime() - x.startTime.getTime()) / 3_600_000, 0) / completed.length
    : 0

  const maxRevenue = Math.max(...monthlyData.map(([, v]) => v.revenue), 1)

  const roleDistribution = {
    NURSE: shifts.filter(s => s.role === 'NURSE').length,
    EN: shifts.filter(s => s.role === 'EN').length,
    PCA: shifts.filter(s => s.role === 'PCA').length,
  }

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fill Rate</p>
            <p className="text-3xl font-bold text-navy mt-1">{fillRate}%</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal rounded-full" style={{ width: `${fillRate}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-navy mt-1">${(data.totalRevenue / 1000).toFixed(1)}k</p>
            <p className="text-xs text-mint mt-1 font-medium">From completed shifts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Shift</p>
            <p className="text-3xl font-bold text-navy mt-1">{avgHoursPerShift.toFixed(1)}h</p>
            <p className="text-xs text-gray-500 mt-1">Average duration</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Workforce</p>
            <p className="text-3xl font-bold text-navy mt-1">{workers.filter(w => w.isActive).length}</p>
            <p className="text-xs text-gray-500 mt-1">Active workers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4" /> Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">No completed shifts yet.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {monthlyData.map(([month, v]) => {
                  const pct = (v.revenue / maxRevenue) * 100
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-[9px] text-teal font-bold">${(v.revenue / 1000).toFixed(1)}k</p>
                      <div className="w-full rounded-t-md bg-gradient-to-t from-teal to-mint transition-all" style={{ height: `${Math.max(pct, 3)}%` }} />
                      <p className="text-[9px] text-gray-400">{month.split(' ')[0]}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" /> Shift Distribution by Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['NURSE', 'EN', 'PCA'] as const).map(role => {
              const count = roleDistribution[role]
              const pct = shifts.length > 0 ? (count / shifts.length) * 100 : 0
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{role}</span>
                    <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${role === 'NURSE' ? 'bg-teal' : role === 'EN' ? 'bg-blue-500' : 'bg-mint'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" /> Shift Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Pending', status: 'PENDING', color: 'bg-amber-400' },
              { label: 'Matched', status: 'MATCHED', color: 'bg-teal-500' },
              { label: 'Clocked In', status: 'CLOCKED_IN', color: 'bg-blue-500' },
              { label: 'Completed', status: 'COMPLETED', color: 'bg-green-500' },
              { label: 'Cancelled', status: 'CANCELLED', color: 'bg-gray-400' },
            ].map(({ label, status, color }) => {
              const count = shifts.filter(s => s.status === status).length
              const pct = shifts.length > 0 ? (count / shifts.length) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{label}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Top Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Top Rated Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workers.filter(w => w.rating).length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No ratings yet.</p>
            ) : (
              <div className="space-y-2">
                {workers
                  .filter(w => w.rating)
                  .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
                  .slice(0, 5)
                  .map(w => (
                    <div key={w.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-navy text-sm">{w.name ?? w.email}</p>
                        <p className="text-xs text-gray-500">{w.role}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="font-bold text-sm">{w.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { broadcast?: string; tab?: string; error?: string }
}) {
  const data = await getDashboardData()
  const showBroadcast = searchParams.broadcast === '1'
  const broadcastError = searchParams.error
  const activeTab = searchParams.tab ?? 'overview'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'compliance', label: 'Compliance', icon: FileWarning },
    { id: 'workforce', label: 'Workforce', icon: Users },
    { id: 'facilities', label: 'Facilities', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const pendingDocsBadge = data.pendingDocs.length

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white p-6 hidden md:flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-mint flex items-center justify-center font-bold text-navy">C</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Carelink</h1>
            <p className="text-xs text-gray-400">Agency Admin</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mt-6">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={tab.id === 'overview' ? '/dashboard' : `/dashboard?tab=${tab.id}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition text-sm ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'compliance' && pendingDocsBadge > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingDocsBadge}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="mt-auto">
          <form action={signOut}>
            <button type="submit" className="w-full px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-left text-sm">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm font-medium">{tabs.find(t => t.id === activeTab)?.label}</p>
            <h2 className="text-3xl font-bold text-navy">Global Dispatch</h2>
          </div>
          <a href="/dashboard?broadcast=1">
            <Button>Broadcast Shift</Button>
          </a>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Shifts', value: data.shifts.length, sub: 'All time', icon: Clock, color: 'text-navy' },
            { label: 'Active Now', value: data.activeShifts.length, sub: 'Matched/On duty', icon: Activity, color: 'text-teal-600' },
            { label: 'Unfilled', value: data.unfilledShifts.length, sub: 'Need workers', icon: FileWarning, color: 'text-amber-600' },
            { label: 'Workforce', value: data.workers.length, sub: `${data.facilities.length} facilities`, icon: Users, color: 'text-navy' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <kpi.icon className="w-4 h-4" /> {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'compliance' && <ComplianceTab data={data} />}
        {activeTab === 'workforce' && <WorkforceTab data={data} />}
        {activeTab === 'facilities' && <FacilitiesTab data={data} />}
        {activeTab === 'analytics' && <AnalyticsTab data={data} />}
      </main>

      {/* Broadcast Overlay */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative m-4">
            <a href="/dashboard" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </a>
            <h3 className="text-xl font-bold text-navy mb-1">Broadcast Shift</h3>
            <p className="text-sm text-gray-500 mb-5">Create a shift and notify available workers instantly.</p>

            {broadcastError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {decodeURIComponent(broadcastError)}
              </div>
            )}

            <form action={broadcastShift} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Facility</label>
                <select name="facilityId" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required>
                  <option value="">Select a facility…</option>
                  {data.facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</label>
                <select name="role" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required>
                  <option value="NURSE">Registered Nurse (RN)</option>
                  <option value="EN">Enrolled Nurse (EN)</option>
                  <option value="PCA">Personal Care Assistant</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start</label>
                  <input type="datetime-local" name="startTime" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">End</label>
                  <input type="datetime-local" name="endTime" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hourly Rate ($)</label>
                <input type="number" name="hourlyRate" step="0.01" min="0" defaultValue="45.00" className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
                <textarea name="notes" rows={2} maxLength={500} placeholder="Optional notes for workers…" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="urgent" className="rounded" />
                <span className="text-sm font-medium text-red-600">Mark as Urgent</span>
              </label>

              <div className="flex gap-3 pt-1">
                <a href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">Cancel</Button>
                </a>
                <Button type="submit" className="flex-1">Broadcast</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
