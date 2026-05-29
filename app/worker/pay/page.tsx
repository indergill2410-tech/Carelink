import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarCheck, Clock, Wallet, UserCircle, TrendingUp } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function PayPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const completedShifts = await prisma.shift.findMany({
    where: { workerId: user.id, status: 'COMPLETED' },
    include: { facility: true },
    orderBy: { startTime: 'desc' },
  })

  const shiftsWithEarnings = completedShifts.map(shift => {
    const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
    const earnings = shift.hourlyRate * hours
    const monthKey = shift.startTime.toLocaleDateString('en-AU', { month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' })
    return { ...shift, hours, earnings, monthKey }
  })

  const totalEarnings = shiftsWithEarnings.reduce((s, x) => s + x.earnings, 0)
  const totalHours = shiftsWithEarnings.reduce((s, x) => s + x.hours, 0)
  const avgRate = completedShifts.length > 0
    ? completedShifts.reduce((s, x) => s + x.hourlyRate, 0) / completedShifts.length
    : 0

  // Group by month for chart
  const byMonth: Record<string, { earnings: number; hours: number; count: number }> = {}
  for (const s of shiftsWithEarnings) {
    if (!byMonth[s.monthKey]) byMonth[s.monthKey] = { earnings: 0, hours: 0, count: 0 }
    byMonth[s.monthKey].earnings += s.earnings
    byMonth[s.monthKey].hours += s.hours
    byMonth[s.monthKey].count += 1
  }
  const monthlyData = Object.entries(byMonth).slice(0, 6).reverse()
  const maxMonthlyEarnings = Math.max(...monthlyData.map(([, v]) => v.earnings), 1)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">Pay Summary</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24 space-y-5">
        {completedShifts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm px-6">
              No completed shifts yet. Accept and complete shifts to see your earnings here.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total Earned</p>
                  <p className="font-bold text-navy text-lg mt-1">${totalEarnings.toFixed(0)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Hours</p>
                  <p className="font-bold text-navy text-lg mt-1">{totalHours.toFixed(0)}h</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg Rate</p>
                  <p className="font-bold text-navy text-lg mt-1">${avgRate.toFixed(0)}/hr</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Earnings Chart */}
            {monthlyData.length > 1 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-teal" />
                    <p className="font-bold text-navy text-sm">Monthly Earnings</p>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {monthlyData.map(([month, data]) => {
                      const pct = (data.earnings / maxMonthlyEarnings) * 100
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <p className="text-[9px] text-teal font-bold">${(data.earnings / 1000).toFixed(1)}k</p>
                          <div className="w-full rounded-t-md bg-teal transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                          <p className="text-[9px] text-gray-400 text-center leading-tight">{month.split(' ')[0]}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shift List */}
            <section>
              <h2 className="font-bold text-navy mb-3 text-lg">Completed Shifts</h2>
              <div className="space-y-3">
                {shiftsWithEarnings.map(shift => (
                  <Card key={shift.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-navy text-sm">{shift.facility.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {shift.startTime.toLocaleDateString('en-AU', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              timeZone: 'Australia/Melbourne',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">{shift.role} · {shift.hours.toFixed(1)}h @ ${shift.hourlyRate.toFixed(0)}/hr</p>
                          {shift.clockInAt && shift.clockOutAt && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              {shift.clockInAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                              {' – '}
                              {shift.clockOutAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                              {' (clocked)'}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-sm">${shift.earnings.toFixed(2)}</p>
                          <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">COMPLETED</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 w-full max-w-2xl bg-white border-t flex justify-around p-3 pb-safe">
        <a href="/worker" className="flex flex-col items-center gap-1 text-gray-400">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 text-gray-400">
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Shifts</span>
        </a>
        <a href="/worker/pay" className="flex flex-col items-center gap-1 text-teal-600">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </a>
        <a href="/worker/profile" className="flex flex-col items-center gap-1 text-gray-400">
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </a>
      </nav>
    </div>
  )
}
