import { Activity, Clock, FileWarning, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { signOut } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

// This runs on the server, making it fast and secure
async function getDashboardData() {
  const [shifts, workers, facilities] = await Promise.all([
    prisma.shift.findMany({
      include: { facility: true, worker: true },
      orderBy: { startTime: 'asc' },
      take: 10
    }),
    prisma.user.findMany({
      where: { role: { in: ['NURSE', 'EN', 'PCA'] } }
    }),
    prisma.facility.count()
  ]);

  const activeShifts = shifts.filter(s => s.status === 'MATCHED' || s.status === 'COMPLETED');
  const unfilledShifts = shifts.filter(s => s.status === 'PENDING');
  const complianceAlerts = workers.filter(w => w.complianceStatus === 'RED' || w.complianceStatus === 'AMBER');

  return { shifts, workers, activeShifts, unfilledShifts, complianceAlerts, facilities };
}

export default async function Dashboard() {
  const data = await getDashboardData();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white p-6 hidden md:flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-mint flex items-center justify-center font-bold">C</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Carelink</h1>
            <p className="text-xs text-gray-400">Enterprise</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 mt-8">
          <a href="/dashboard" className="px-4 py-3 rounded-xl bg-white/10 text-white font-medium">Dashboard</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Live Shifts</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Compliance</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Workforce</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Facilities</a>
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
            <p className="text-gray-500 text-sm font-medium">Victoria Operations</p>
            <h2 className="text-3xl font-bold text-navy">Global Dispatch</h2>
          </div>
          <div className="flex gap-4">
            <Button variant="outline">Export Data</Button>
            <Button>Broadcast Shift</Button>
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
              <p className="text-xs text-gray-500 mt-1 font-medium">Expiring documents</p>
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
              <p className="text-xs text-gray-500 mt-1 font-medium">Across {data.facilities} facilities</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables/Lists */}
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
                  data.shifts.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-navy text-xs">{s.role}</div>
                        <div>
                          <p className="font-semibold text-navy">{s.facility.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                            {' '}· {s.worker ? s.worker.name : 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        s.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        s.status === 'MATCHED' ? 'bg-mint text-white' :
                        'bg-teal-100 text-teal-800'
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
                  <Button size="sm" variant="destructive" className="w-full">Override Dispatch</Button>
                </div>
              ))}
              {data.complianceAlerts.slice(0,3).map(w => (
                <div key={w.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="font-bold text-amber-900 text-sm">Compliance Review</p>
                  <p className="text-amber-700 text-xs mt-1 mb-3">{w.name || w.email} · {w.complianceStatus}</p>
                  <Button size="sm" variant="outline" className="w-full bg-white text-amber-900 border-amber-200">Review</Button>
                </div>
              ))}
              {data.unfilledShifts.length === 0 && data.complianceAlerts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">You&apos;re all caught up!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
