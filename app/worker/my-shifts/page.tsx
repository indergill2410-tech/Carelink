import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { CalendarCheck, Clock, Wallet, UserCircle, Stethoscope } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function MyShiftsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const shifts = await prisma.shift.findMany({
    where: { workerId: user.id },
    include: { facility: true },
    orderBy: { startTime: 'asc' },
  })

  const now = new Date()

  const upcomingShifts = shifts.filter(
    s => s.status === 'MATCHED' && new Date(s.startTime) >= now
  )
  const overdueShifts = shifts.filter(
    s => s.status === 'MATCHED' && new Date(s.startTime) < now
  )
  const pastShifts = shifts.filter(
    s => s.status === 'COMPLETED' || s.status === 'CANCELLED'
  )

  async function markComplete(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    await prisma.shift.updateMany({
      where: { id: shiftId, workerId: authUser.id, status: 'MATCHED' },
      data: { status: 'COMPLETED' },
    })

    revalidatePath('/worker/my-shifts')
    revalidatePath('/worker')
  }

  async function cancelShift(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    await prisma.shift.updateMany({
      where: { id: shiftId, workerId: authUser.id, status: 'MATCHED' },
      data: { status: 'CANCELLED' },
    })

    revalidatePath('/worker/my-shifts')
    revalidatePath('/worker')
  }

  function formatShiftTime(startTime: Date, endTime: Date) {
    const date = new Date(startTime).toLocaleDateString('en-AU', {
      weekday: 'short', month: 'short', day: 'numeric',
      timeZone: 'Australia/Melbourne',
    })
    const start = new Date(startTime).toLocaleTimeString('en-AU', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Australia/Melbourne',
    })
    const end = new Date(endTime).toLocaleTimeString('en-AU', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Australia/Melbourne',
    })
    return `${date} • ${start} – ${end}`
  }

  function ShiftCard({
    shift,
    showMarkComplete,
    showCancel,
  }: {
    shift: typeof shifts[number]
    showMarkComplete?: boolean
    showCancel?: boolean
  }) {
    return (
      <Card className="overflow-hidden">
        <div className={`h-2 w-full ${shift.status === 'MATCHED' ? 'bg-amber-400' : shift.status === 'COMPLETED' ? 'bg-green-400' : 'bg-gray-300'}`} />
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-ink">{shift.facility.name}</h3>
            <StatusBadge status={shift.status} />
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatShiftTime(shift.startTime, shift.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-400" />
              <span>{shift.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span>${shift.hourlyRate.toFixed(0)}/hr</span>
            </div>
          </div>
          {showMarkComplete && (
            <form action={markComplete} className="mt-3">
              <input type="hidden" name="shiftId" value={shift.id} />
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold text-sm">
                Mark Complete
              </Button>
            </form>
          )}
          {showCancel && (
            <form action={cancelShift} className="mt-3">
              <input type="hidden" name="shiftId" value={shift.id} />
              <Button type="submit" variant="outline" className="w-full font-bold text-sm text-red-600 border-red-300 hover:bg-red-50">
                Cancel Shift
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto shadow-card">
      {/* Mobile Header */}
      <header className="mesh-hero text-white px-6 py-6 rounded-b-[2rem] shadow-modal">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-electric font-medium">My Shifts</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24 space-y-6">
        {/* Upcoming */}
        <section>
          <h2 className="font-bold text-ink mb-3 text-lg">Upcoming Shifts</h2>
          {upcomingShifts.length === 0 && overdueShifts.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="h-6 w-6" />}
              title="No upcoming shifts"
              description="Browse the feed to accept your next booking."
            />
          ) : (
            <div className="space-y-4">
              {overdueShifts.map(shift => (
                <ShiftCard key={shift.id} shift={shift} showMarkComplete />
              ))}
              {upcomingShifts.map(shift => (
                <ShiftCard key={shift.id} shift={shift} showMarkComplete showCancel />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="font-bold text-ink mb-3 text-lg">Past Shifts</h2>
          {pastShifts.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-6 w-6" />}
              title="No past shifts yet"
              description="Completed and cancelled shifts will be listed here."
            />
          ) : (
            <div className="space-y-4">
              {pastShifts.map(shift => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[min(92vw,40rem)] -translate-x-1/2 justify-around rounded-3xl border border-white/70 bg-white/85 p-2 shadow-hover backdrop-blur-xl">
        <a href="/worker" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 rounded-2xl bg-electric/10 px-4 py-2 text-electric-dim">
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Shifts</span>
        </a>
        <a href="/worker/pay" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
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
