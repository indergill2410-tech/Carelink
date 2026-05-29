import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Clock, Wallet, UserCircle, Stethoscope, MapPin, LogIn, LogOut, Star } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function MyShiftsPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const shifts = await prisma.shift.findMany({
    where: { workerId: user.id },
    include: { facility: true, ratings: { where: { raterId: user.id } } },
    orderBy: { startTime: 'desc' },
  })

  const now = new Date()
  const upcoming = shifts.filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status) && s.endTime >= now)
  const overdue = shifts.filter(s => s.status === 'MATCHED' && s.endTime < now)
  const past = shifts.filter(s => ['COMPLETED', 'CANCELLED'].includes(s.status))

  async function clockIn(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')
    await prisma.shift.updateMany({
      where: { id: shiftId, workerId: authUser.id, status: 'MATCHED' },
      data: { status: 'CLOCKED_IN', clockInAt: new Date() },
    })
    revalidatePath('/worker/my-shifts')
    revalidatePath('/facility')
  }

  async function clockOut(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')
    await prisma.shift.updateMany({
      where: { id: shiftId, workerId: authUser.id, status: 'CLOCKED_IN' },
      data: { status: 'COMPLETED', clockOutAt: new Date() },
    })
    revalidatePath('/worker/my-shifts')
    revalidatePath('/facility')
    revalidatePath('/dashboard')
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
  }

  async function rateShift(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    const rating = parseInt(formData.get('rating') as string, 10)
    const comment = (formData.get('comment') as string) || null
    if (!shiftId || !rating || rating < 1 || rating > 5) return
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, workerId: authUser.id },
    })
    if (!shift) return
    await prisma.shiftRating.upsert({
      where: { shiftId_raterId: { shiftId, raterId: authUser.id } },
      create: { shiftId, raterId: authUser.id, rateeId: shift.facilityId, rating, comment },
      update: { rating, comment },
    })
    revalidatePath('/worker/my-shifts')
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })
  }
  function formatDate(d: Date) {
    return d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })
  }

  type ShiftWithIncludes = typeof shifts[number]

  function ShiftCard({ shift, section }: { shift: ShiftWithIncludes; section: 'upcoming' | 'overdue' | 'past' }) {
    const hrs = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
    const earnings = shift.hourlyRate * hrs
    const hasRated = shift.ratings.length > 0
    const isOverdue = section === 'overdue'
    const canClockIn = shift.status === 'MATCHED' && shift.startTime <= new Date(Date.now() + 30 * 60 * 1000)
    const isClockedIn = shift.status === 'CLOCKED_IN'
    const isCompleted = shift.status === 'COMPLETED'

    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className={`h-1.5 w-full ${
          isClockedIn ? 'bg-blue-500' :
          isCompleted ? 'bg-green-500' :
          shift.status === 'CANCELLED' ? 'bg-gray-300' :
          isOverdue ? 'bg-red-500' : 'bg-amber-400'
        }`} />
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-navy">{shift.facility.name}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isClockedIn ? 'bg-blue-100 text-blue-700' :
              isCompleted ? 'bg-green-100 text-green-700' :
              shift.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500' :
              'bg-amber-100 text-amber-700'
            }`}>
              {isClockedIn ? 'ON DUTY' : shift.status}
            </span>
          </div>

          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatDate(shift.startTime)} · {formatTime(shift.startTime)} – {formatTime(shift.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-400" />
              <span>{shift.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{shift.facility.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span>${shift.hourlyRate.toFixed(0)}/hr · Est. ${earnings.toFixed(0)}</span>
            </div>
            {isClockedIn && shift.clockInAt && (
              <p className="text-xs text-blue-600 font-medium pl-6">
                Clocked in at {formatTime(shift.clockInAt)}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 space-y-2">
            {isClockedIn && (
              <form action={clockOut}>
                <input type="hidden" name="shiftId" value={shift.id} />
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold gap-2">
                  <LogOut className="w-4 h-4" /> Clock Out
                </Button>
              </form>
            )}
            {(canClockIn || isOverdue) && shift.status === 'MATCHED' && (
              <form action={clockIn}>
                <input type="hidden" name="shiftId" value={shift.id} />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold gap-2">
                  <LogIn className="w-4 h-4" /> Clock In
                </Button>
              </form>
            )}
            {shift.status === 'MATCHED' && !canClockIn && (
              <form action={cancelShift}>
                <input type="hidden" name="shiftId" value={shift.id} />
                <Button type="submit" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 font-bold text-sm">
                  Cancel Shift
                </Button>
              </form>
            )}
            {isCompleted && !hasRated && (
              <details className="mt-2">
                <summary className="text-sm text-teal cursor-pointer font-medium flex items-center gap-1">
                  <Star className="w-4 h-4" /> Rate this shift
                </summary>
                <form action={rateShift} className="mt-3 space-y-2">
                  <input type="hidden" name="shiftId" value={shift.id} />
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <label key={n} className="cursor-pointer">
                        <input type="radio" name="rating" value={n} className="sr-only" required />
                        <span className="text-2xl hover:scale-110 transition-transform block">{n <= 3 ? '⭐' : '⭐'}</span>
                      </label>
                    ))}
                  </div>
                  <textarea name="comment" rows={2} placeholder="Optional comment…" maxLength={500} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
                  <Button type="submit" size="sm" className="w-full">Submit Rating</Button>
                </form>
              </details>
            )}
            {isCompleted && hasRated && (
              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                <Star className="w-3 h-3" /> Rated {shift.ratings[0].rating}/5
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">My Shifts</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24 space-y-6">
        {searchParams.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}
        {searchParams.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {decodeURIComponent(searchParams.success)}
          </div>
        )}

        {overdue.length > 0 && (
          <section>
            <h2 className="font-bold text-red-700 mb-3 text-base flex items-center gap-2">
              <Clock className="w-4 h-4" /> Needs Attention
            </h2>
            <div className="space-y-4">
              {overdue.map(s => <ShiftCard key={s.id} shift={s} section="overdue" />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-bold text-navy mb-3 text-lg">Upcoming Shifts</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No upcoming shifts. Browse the Feed to accept one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map(s => <ShiftCard key={s.id} shift={s} section="upcoming" />)}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-bold text-navy mb-3 text-lg">Past Shifts</h2>
          {past.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No past shifts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {past.map(s => <ShiftCard key={s.id} shift={s} section="past" />)}
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 w-full max-w-2xl bg-white border-t flex justify-around p-3 pb-safe">
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
    </div>
  )
}
