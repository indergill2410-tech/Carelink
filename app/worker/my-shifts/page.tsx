import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Clock, Wallet, UserCircle, Stethoscope } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function MyShiftsPage() {
  const supabase = createClient()
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

    const supabase = createClient()
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

    const supabase = createClient()
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

  function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
      MATCHED: 'bg-amber-100 text-amber-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
    }
    return (
      <span className={`text-xs font-bold px-2 py-1 rounded-md ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    )
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
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className={`h-2 w-full ${shift.status === 'MATCHED' ? 'bg-amber-400' : shift.status === 'COMPLETED' ? 'bg-green-400' : 'bg-gray-300'}`} />
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-navy">{shift.facility.name}</h3>
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:hidden">
      {/* Mobile Header */}
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">My Shifts</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24 space-y-6">
        {/* Upcoming */}
        <section>
          <h2 className="font-bold text-navy mb-3 text-lg">Upcoming Shifts</h2>
          {upcomingShifts.length === 0 && overdueShifts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500">No upcoming shifts. Browse the Feed to accept one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {overdueShifts.map(shift => (
                <ShiftCard key={shift.id} shift={shift} showMarkComplete />
              ))}
              {upcomingShifts.map(shift => (
                <ShiftCard key={shift.id} shift={shift} showCancel />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="font-bold text-navy mb-3 text-lg">Past Shifts</h2>
          {pastShifts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500">No past shifts yet.</p>
            </div>
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
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe">
        <a href="/worker" className="flex flex-col items-center gap-1 text-gray-400">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 text-teal-600">
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Shifts</span>
        </a>
        <a href="/worker/pay" className="flex flex-col items-center gap-1 text-gray-400">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </a>
        <a href="/worker/profile" className="flex flex-col items-center gap-1 text-gray-400">
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </a>
      </nav>

      {/* Desktop overlay */}
      <div className="hidden md:flex fixed inset-0 bg-navy/90 z-50 items-center justify-center p-8 text-center text-white">
        <div className="max-w-md space-y-4">
          <Stethoscope className="w-12 h-12 mx-auto text-teal-400" />
          <h2 className="text-2xl font-bold">Mobile View Only</h2>
          <p className="text-gray-300">The Worker App is designed for mobile. Open this on a phone or shrink your browser window.</p>
          <a href="/dashboard" className="inline-block mt-4 text-teal-400 underline">Return to Admin Dashboard</a>
        </div>
      </div>
    </div>
  )
}
