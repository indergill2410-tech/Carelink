import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatsCard } from '@/components/ui/stats-card'
import { StatusBadge } from '@/components/ui/status-badge'
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
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto shadow-card">
      {/* Mobile Header */}
      <header className="mesh-hero text-white px-6 py-6 rounded-b-[2rem] shadow-modal">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-electric font-medium">Pay Summary</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24 space-y-6">
        {shiftsCount === 0 ? (
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="No completed shifts yet"
            description="Accept and complete shifts to see your earnings here."
          />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatsCard label="Total Earned" value={`$${totalEarnings.toFixed(0)}`} tone="success" />
              <StatsCard label="Shifts" value={shiftsCount} tone="blue" />
              <StatsCard label="Avg Rate" value={`$${avgRate.toFixed(0)}/hr`} />
            </div>

            {/* Shift List */}
            <section>
              <h2 className="font-bold text-ink mb-3 text-lg">Completed Shifts</h2>
              <div className="space-y-3">
                {shiftsWithEarnings.map(shift => (
                  <Card key={shift.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-ink text-sm">{shift.facility.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(shift.startTime).toLocaleDateString('en-AU', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              timeZone: 'Australia/Melbourne',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">{shift.role} • {shift.hours.toFixed(1)}h @ ${shift.hourlyRate.toFixed(0)}/hr</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-sm number-tabular">${shift.earnings.toFixed(2)}</p>
                          <StatusBadge status="COMPLETED" />
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
      <nav className="fixed bottom-3 left-1/2 z-40 flex w-[min(92vw,40rem)] -translate-x-1/2 justify-around rounded-3xl border border-white/70 bg-white/85 p-2 shadow-hover backdrop-blur-xl">
        <a href="/worker" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Shifts</span>
        </a>
        <a href="/worker/pay" className="flex flex-col items-center gap-1 rounded-2xl bg-electric/10 px-4 py-2 text-electric-dim">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </a>
        <a href="/worker/profile" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </a>
      </nav>

    </div>
  )
}
