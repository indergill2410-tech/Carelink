import { Activity, Clock, FileWarning, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
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
          <a href="#" className="px-4 py-3 rounded-xl bg-white/10 text-white font-medium">Dashboard</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Live Shifts</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Compliance</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Workforce</a>
          <a href="#" className="px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">Facilities</a>
        </nav>
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
              <div className="text-3xl font-bold text-navy">148</div>
              <p className="text-xs text-mint mt-1 font-medium">+12 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Unfilled Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">12</div>
              <p className="text-xs text-amber-500 mt-1 font-medium">4 start within 2 hrs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileWarning className="w-4 h-4" /> Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">23</div>
              <p className="text-xs text-gray-500 mt-1 font-medium">7 expiring this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Active Workforce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">89</div>
              <p className="text-xs text-gray-500 mt-1 font-medium">31 RN · 18 EN · 40 PCA</p>
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
                {[
                  { fac: "BlueCross Carlton", role: "RN", time: "7:00 PM - 7:00 AM", status: "Requested", worker: "Unassigned", color: "bg-amber-100 text-amber-800" },
                  { fac: "Mercy Place Keon Park", role: "PCA", time: "3:00 PM - 11:00 PM", status: "Filled", worker: "Mia Collins", color: "bg-teal-100 text-teal-800" },
                  { fac: "Bupa Ashbury", role: "RN", time: "7:00 AM - 3:00 PM", status: "Clocked In", worker: "Sarah Nguyen", color: "bg-mint text-white" }
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-navy text-xs">{s.role}</div>
                      <div>
                        <p className="font-semibold text-navy">{s.fac}</p>
                        <p className="text-sm text-gray-500">{s.time} · {s.worker}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.color}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Urgent Action Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="font-bold text-red-900 text-sm">2 RN Night Shifts</p>
                <p className="text-red-700 text-xs mt-1 mb-3">BlueCross Carlton · Starts in 90 min</p>
                <Button size="sm" variant="destructive" className="w-full">Override Dispatch</Button>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="font-bold text-amber-900 text-sm">Police Check Expiring</p>
                <p className="text-amber-700 text-xs mt-1 mb-3">Olivia Tan · Expires in 3 days</p>
                <Button size="sm" variant="outline" className="w-full bg-white text-amber-900 border-amber-200">Review Compliance</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
