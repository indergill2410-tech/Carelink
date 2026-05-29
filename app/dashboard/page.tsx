import { Activity, Clock, FileWarning, Users, X, Building2, CheckCircle, XCircle, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { signOut } from '@/app/login/actions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

// ─── Server actions ────────────────────────────────────────────────────────────

async function broadcastShift(formData: FormData) {
  'use server'
  const facilityId = formData.get('facilityId') as string;
  const role = formData.get('role') as string;
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;
  const hourlyRate = parseFloat(formData.get('hourlyRate') as string);

  if (!facilityId || !role || !startTime || !endTime || isNaN(hourlyRate)) {
    redirect('/dashboard?broadcast=1&error=Invalid+shift+details');
  }

  await prisma.shift.create({
    data: {
      facilityId,
      role: role as Role,
      status: 'PENDING',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      hourlyRate,
    },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

async function toggleCompliance(formData: FormData) {
  'use server'
  const workerId = formData.get('workerId') as string;
  if (!workerId) return;

  const worker = await prisma.user.findUnique({ where: { id: workerId } });
  if (!worker) return;

  const newStatus = worker.complianceStatus === 'GREEN' ? 'RED' : 'GREEN';
  await prisma.user.update({
    where: { id: workerId },
    data: { complianceStatus: newStatus },
  });

  revalidatePath('/dashboard');
}

async function cancelShift(formData: FormData) {
  'use server'
  const shiftId = formData.get('shiftId') as string;
  if (!shiftId) return;

  await prisma.shift.update({
    where: { id: shiftId },
    data: { status: 'CANCELLED' },
  });

  revalidatePath('/dashboard');
}

// ─── Data fetcher ──────────────────────────────────────────────────────────────

async function getDashboardData() {
  const [shifts, workers, facilitiesList] = await Promise.all([
    prisma.shift.findMany({
      include: { facility: true, worker: true },
      orderBy: { startTime: 'asc' },
      take: 50,
    }),
    prisma.user.findMany({
      where: { role: { in: ['NURSE', 'EN', 'PCA'] } },
      orderBy: { name: 'asc' },
    }),
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const activeShifts = shifts.filter(s => s.status === 'MATCHED' || s.status === 'COMPLETED');
  const unfilledShifts = shifts.filter(s => s.status === 'PENDING');
  const complianceAlerts = workers.filter(w => w.complianceStatus === 'RED' || w.complianceStatus === 'AMBER');

  return { shifts, workers, activeShifts, unfilledShifts, complianceAlerts, facilities: facilitiesList };
}

// ─── Tab views ─────────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Dispatch Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.shifts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border border-dashed rounded-xl">
                No shifts requested yet. Broadcast a shift to get started.
              </div>
            ) : (
              data.shifts.slice(0, 10).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-navy text-xs">{s.role}</div>
                    <div>
                      <p className="font-semibold text-navy">{s.facility.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(s.startTime).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                        {' · '}
                        {new Date(s.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                        {' – '}
                        {new Date(s.endTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                        {' · '}{s.worker ? s.worker.name : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    s.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    s.status === 'MATCHED' ? 'bg-teal-100 text-teal-800' :
                    s.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {s.status}
                  </span>
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
        <CardContent className="space-y-4">
          {data.unfilledShifts.map(s => (
            <div key={s.id} className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="font-bold text-red-900 text-sm">{s.role} Shift</p>
              <p className="text-red-700 text-xs mt-1 mb-3">{s.facility.name} · Unfilled</p>
              <form action={cancelShift}>
                <input type="hidden" name="shiftId" value={s.id} />
                <Button size="sm" variant="destructive" className="w-full" type="submit">Override Dispatch</Button>
              </form>
            </div>
          ))}
          {data.complianceAlerts.slice(0, 3).map(w => (
            <div key={w.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="font-bold text-amber-900 text-sm">Compliance Review</p>
              <p className="text-amber-700 text-xs mt-1 mb-3">{w.name || w.email} · {w.complianceStatus}</p>
              <form action={toggleCompliance}>
                <input type="hidden" name="workerId" value={w.id} />
                <Button size="sm" variant="outline" className="w-full bg-white text-amber-900 border-amber-200" type="submit">
                  {w.complianceStatus === 'GREEN' ? 'Mark RED' : 'Mark GREEN'}
                </Button>
              </form>
            </div>
          ))}
          {data.unfilledShifts.length === 0 && data.complianceAlerts.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">You&apos;re all caught up!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ComplianceTab({ workers, toggleCompliance }: {
  workers: Awaited<ReturnType<typeof getDashboardData>>['workers'],
  toggleCompliance: (fd: FormData) => Promise<void>
}) {
  const green = workers.filter(w => w.complianceStatus === 'GREEN');
  const nonGreen = workers.filter(w => w.complianceStatus !== 'GREEN');

  return (
    <div className="space-y-6">
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
            <div className="space-y-3">
              {/* Non-compliant first */}
              {[...nonGreen, ...green].map(w => (
                <div key={w.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      w.complianceStatus === 'GREEN' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {w.complianceStatus === 'GREEN'
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm">{w.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{w.email} · {w.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      w.complianceStatus === 'GREEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {w.complianceStatus}
                    </span>
                    <form action={toggleCompliance}>
                      <input type="hidden" name="workerId" value={w.id} />
                      <Button size="sm" variant="outline" type="submit">
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

function WorkforceTab({ workers }: { workers: Awaited<ReturnType<typeof getDashboardData>>['workers'] }) {
  const byRole = {
    NURSE: workers.filter(w => w.role === 'NURSE'),
    EN: workers.filter(w => w.role === 'EN'),
    PCA: workers.filter(w => w.role === 'PCA'),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {(['NURSE', 'EN', 'PCA'] as const).map(role => (
          <div key={role} className="bg-white border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-navy">{byRole[role].length}</p>
            <p className="text-sm text-gray-500">{role === 'NURSE' ? 'Registered Nurses' : role === 'EN' ? 'Enrolled Nurses' : 'Personal Care Assistants'}</p>
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
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {workers.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-navy">{w.name ?? '—'}</td>
                      <td className="py-3 text-gray-500">{w.email}</td>
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

function FacilitiesTab({ facilities, shifts }: {
  facilities: Awaited<ReturnType<typeof getDashboardData>>['facilities'],
  shifts: Awaited<ReturnType<typeof getDashboardData>>['shifts']
}) {
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
            <div className="space-y-4">
              {facilities.map(f => {
                const facilityShifts = shifts.filter(s => s.facilityId === f.id);
                const active = facilityShifts.filter(s => s.status === 'MATCHED').length;
                const pending = facilityShifts.filter(s => s.status === 'PENDING').length;

                return (
                  <div key={f.id} className="p-4 border rounded-xl hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy">{f.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{f.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-right">
                        <div className="text-center">
                          <p className="text-lg font-bold text-navy">{active}</p>
                          <p className="text-xs text-gray-500">Active</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-amber-600">{pending}</p>
                          <p className="text-xs text-gray-500">Pending</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-600">{facilityShifts.length}</p>
                          <p className="text-xs text-gray-500">Total</p>
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

// ─── Main page ─────────────────────────────────────────────────────────────────

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { broadcast?: string; tab?: string; error?: string };
}) {
  const data = await getDashboardData();
  const showBroadcast = searchParams.broadcast === '1';
  const broadcastError = searchParams.error;
  const activeTab = searchParams.tab ?? 'overview';

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'compliance', label: 'Compliance', icon: FileWarning },
    { id: 'workforce', label: 'Workforce', icon: Users },
    { id: 'facilities', label: 'Facilities', icon: Building2 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white p-6 hidden md:flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-mint flex items-center justify-center font-bold">C</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Carelink</h1>
            <p className="text-xs text-gray-400">Enterprise</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mt-8">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={tab.id === 'overview' ? '/dashboard' : `/dashboard?tab=${tab.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto">
          <form action={signOut}>
            <button type="submit" className="w-full px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-left text-sm">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm font-medium">
              {tabs.find(t => t.id === activeTab)?.label ?? 'Dashboard'}
            </p>
            <h2 className="text-3xl font-bold text-navy">Global Dispatch</h2>
          </div>
          <div className="flex gap-4">
            <a href="/dashboard?broadcast=1">
              <Button>Broadcast Shift</Button>
            </a>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Live Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">{data.shifts.length}</div>
              <p className="text-xs text-mint mt-1 font-medium">Tracking currently</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Unfilled Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">{data.unfilledShifts.length}</div>
              <p className="text-xs text-amber-500 mt-1 font-medium">Require action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileWarning className="w-4 h-4" /> Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">{data.complianceAlerts.length}</div>
              <p className="text-xs text-gray-500 mt-1 font-medium">Require review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Active Workforce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">{data.workers.length}</div>
              <p className="text-xs text-gray-500 mt-1 font-medium">Across {data.facilities.length} facilities</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'compliance' && <ComplianceTab workers={data.workers} toggleCompliance={toggleCompliance} />}
        {activeTab === 'workforce' && <WorkforceTab workers={data.workers} />}
        {activeTab === 'facilities' && <FacilitiesTab facilities={data.facilities} shifts={data.shifts} />}

        {/* Broadcast Shift Overlay */}
        {showBroadcast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
              <a href="/dashboard" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </a>
              <h3 className="text-xl font-bold text-navy mb-1">Broadcast Shift</h3>
              <p className="text-sm text-gray-500 mb-6">Create a new shift request and notify available workers.</p>

              {broadcastError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {decodeURIComponent(broadcastError)}
                </div>
              )}

              <form action={broadcastShift} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Facility</label>
                  <select
                    name="facilityId"
                    className="w-full flex h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    required
                  >
                    <option value="">Select a facility…</option>
                    {data.facilities.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Role</label>
                  <select
                    name="role"
                    className="w-full flex h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    required
                  >
                    <option value="NURSE">Registered Nurse (RN)</option>
                    <option value="EN">Enrolled Nurse (EN)</option>
                    <option value="PCA">Personal Care Assistant (PCA)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      className="w-full flex h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">End Time</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      className="w-full flex h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Hourly Rate ($)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    step="0.01"
                    min="0"
                    defaultValue="45.00"
                    className="w-full flex h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <a href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">Cancel</Button>
                  </a>
                  <Button type="submit" className="flex-1">Broadcast</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
