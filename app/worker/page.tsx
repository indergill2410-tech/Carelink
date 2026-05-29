import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, CalendarCheck, Wallet, UserCircle, Clock, AlertTriangle, MapPin, DollarSign } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { AcceptShiftSchema } from '@/lib/validations'
import { notifyShiftAccepted } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

async function getWorkerData() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const availableShifts = await prisma.shift.findMany({
    where: { status: 'PENDING', workerId: null },
    include: { facility: true },
    orderBy: [{ urgent: 'desc' }, { startTime: 'asc' }],
  })

  const myActiveShifts = await prisma.shift.count({
    where: { workerId: user.id, status: { in: ['MATCHED', 'CLOCKED_IN'] } },
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  })

  return { user: dbUser, availableShifts, myActiveShifts, unreadCount }
}

export default async function WorkerPortal({ searchParams }: { searchParams: { error?: string; filter?: string } }) {
  const { user, availableShifts, myActiveShifts, unreadCount } = await getWorkerData()
  const errorMessage = searchParams.error
  const filter = searchParams.filter ?? 'all'

  const filteredShifts = filter === 'urgent'
    ? availableShifts.filter(s => s.urgent)
    : availableShifts

  async function acceptShift(formData: FormData) {
    'use server'
    const parsed = AcceptShiftSchema.safeParse({ shiftId: formData.get('shiftId') })
    if (!parsed.success) redirect('/worker?error=Invalid+shift')

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!dbUser) redirect('/login')

    if (dbUser.complianceStatus !== 'GREEN') {
      redirect('/worker?error=compliance_required')
    }

    const shift = await prisma.shift.findUnique({
      where: { id: parsed.data.shiftId },
      include: { facility: true },
    })
    if (!shift || shift.status !== 'PENDING' || shift.workerId) {
      redirect('/worker?error=shift_already_taken')
    }

    const result = await prisma.shift.updateMany({
      where: { id: parsed.data.shiftId, workerId: null, status: 'PENDING' },
      data: { workerId: dbUser.id, status: 'MATCHED' },
    })

    if (result.count === 0) redirect('/worker?error=shift_already_taken')

    await notifyShiftAccepted(dbUser.id, shift.facility.name, parsed.data.shiftId)

    revalidatePath('/worker')
    revalidatePath('/dashboard')
    revalidatePath('/facility')
  }

  const isCompliant = user.complianceStatus === 'GREEN'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">Welcome back,</p>
            <h1 className="font-bold text-xl">{user.name ?? 'Worker'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-teal-100">Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${isCompliant ? 'bg-green-400' : 'bg-rose-400'}`} />
              <span className="text-sm font-semibold">{isCompliant ? 'Compliant' : 'Incomplete'}</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-teal-100">Active</p>
            <p className="text-sm font-semibold mt-1">{myActiveShifts} shifts</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-teal-100">Role</p>
            <p className="text-sm font-semibold mt-1">{user.role}</p>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="flex-1 px-4 py-5 overflow-y-auto pb-24 space-y-4">
        {/* Compliance Banner */}
        {!isCompliant && (
          <a href="/worker/profile" className="block p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 text-sm">Action Required — Upload Your Documents</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You need to be fully compliant before accepting shifts. Tap to upload your documents now.
                </p>
              </div>
            </div>
          </a>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMessage === 'compliance_required'
              ? 'You must be fully compliant before accepting shifts.'
              : errorMessage === 'shift_already_taken'
              ? 'That shift was just taken by another worker.'
              : decodeURIComponent(errorMessage)}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: `All (${availableShifts.length})` },
            { id: 'urgent', label: `Urgent (${availableShifts.filter(s => s.urgent).length})` },
          ].map(f => (
            <a
              key={f.id}
              href={`/worker?filter=${f.id}`}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filter === f.id
                  ? 'bg-navy text-white'
                  : 'bg-white text-gray-500 border hover:bg-gray-50'
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>

        <h2 className="font-bold text-navy text-lg">Available Shifts Near You</h2>

        {filteredShifts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <CalendarCheck className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No open shifts right now. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShifts.map(shift => {
              const hrs = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
              const est = shift.hourlyRate * hrs
              return (
                <Card key={shift.id} className="border-0 shadow-sm overflow-hidden">
                  <div className={`h-1.5 w-full ${shift.urgent ? 'bg-red-500' : 'bg-amber-400'}`} />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-navy">{shift.facility.name}</h3>
                        {shift.urgent && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">URGENT</span>
                        )}
                      </div>
                      <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded-md">
                        ${shift.hourlyRate.toFixed(0)}/hr
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                          {' · '}
                          {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' – '}
                          {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        <span>{shift.role} Required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{shift.facility.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span>Est. ${est.toFixed(0)} for {hrs.toFixed(1)}h</span>
                      </div>
                      {shift.notes && (
                        <p className="text-xs text-gray-400 italic pl-6">{shift.notes}</p>
                      )}
                    </div>

                    <form action={acceptShift} className="mt-4">
                      <input type="hidden" name="shiftId" value={shift.id} />
                      <Button
                        type="submit"
                        className={`w-full font-bold ${shift.urgent ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        disabled={!isCompliant}
                      >
                        {isCompliant ? 'Accept Shift' : 'Complete Compliance First'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full max-w-2xl bg-white border-t flex justify-around p-3 pb-safe">
        <a href="/worker" className="flex flex-col items-center gap-1 text-teal-600">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 text-gray-400">
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
