import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarCheck, Clock, Wallet, UserCircle, Stethoscope } from 'lucide-react'
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
    const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3_600_000
    const earnings = shift.hourlyRate * hours
    return { ...shift, hours, earnings }
  })

  const totalEarnings = shiftsWithEarnings.reduce((sum, s) => sum + s.earnings, 0)
  const shiftsCount = completedShifts.length
  const avgRate = shiftsCount > 0
    ? completedShifts.reduce((sum, s) => sum + s.hourlyRate, 0) / shiftsCount
    : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Mobile Header */}
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">Pay Summary</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24 space-y-6">
        {shiftsCount === 0 ? (
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
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Shifts</p>
                  <p className="font-bold text-navy text-lg mt-1">{shiftsCount}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg Rate</p>
                  <p className="font-bold text-navy text-lg mt-1">${avgRate.toFixed(0)}/hr</p>
                </CardContent>
              </Card>
            </div>

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
                            {new Date(shift.startTime).toLocaleDateString('en-AU', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              timeZone: 'Australia/Melbourne',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">{shift.role} • {shift.hours.toFixed(1)}h @ ${shift.hourlyRate.toFixed(0)}/hr</p>
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

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe">
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
