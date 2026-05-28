import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, CalendarCheck, Wallet, UserCircle, MapPin, Clock } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic';


async function getWorkerData() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  // Available shifts: Requested status, no worker assigned
  const availableShifts = await prisma.shift.findMany({
    where: { status: 'REQUESTED', workerId: null },
    include: { facility: true },
    orderBy: { startTime: 'asc' }
  })

  // My accepted shifts
  const myShifts = await prisma.shift.findMany({
    where: { workerId: user.id },
    include: { facility: true },
    orderBy: { startTime: 'asc' }
  })

  return { user: dbUser, availableShifts, myShifts }
}

export default async function WorkerPortal() {
  const { user, availableShifts, myShifts } = await getWorkerData()

  async function acceptShift(formData: FormData) {
    'use server'
    const { AcceptShiftSchema } = await import('@/lib/validations')
    const parsed = AcceptShiftSchema.safeParse({ shiftId: formData.get('shiftId') })
    if (!parsed.success) redirect('/worker?error=Invalid+shift')

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!dbUser) redirect('/login')

    if (dbUser.complianceStatus !== 'GREEN') {
      redirect('/worker?error=compliance_required')
    }

    const result = await prisma.shift.updateMany({
      where: {
        id: parsed.data.shiftId,
        workerId: null,
        status: 'REQUESTED',
      },
      data: {
        workerId: dbUser.id,
        status: 'FILLED',
      },
    })

    if (result.count === 0) {
      redirect('/worker?error=shift_already_taken')
    }

    revalidatePath('/worker')
    revalidatePath('/dashboard')
    revalidatePath('/facility')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:hidden">
      {/* Mobile Header */}
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">Welcome back,</p>
            <h1 className="font-bold text-xl">{user.name}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center font-bold shadow-inner">
            {user.role}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <div className="bg-white/10 rounded-xl p-3 flex-1">
            <p className="text-xs text-teal-100">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${user.complianceStatus === 'GREEN' ? 'bg-mint' : 'bg-rose-400'}`}></div>
              <a href="/worker/compliance" className="text-sm font-semibold underline text-white">{user.complianceStatus === 'GREEN' ? 'Compliant' : 'Upload Docs'}</a>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex-1">
            <p className="text-xs text-teal-100">Shifts This Week</p>
            <p className="text-sm font-semibold mt-1">{myShifts.length}</p>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        <h2 className="font-bold text-navy mb-4 text-lg">Available Shifts Near You</h2>

        {availableShifts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">No open shifts matching your role.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableShifts.map(shift => (
              <Card key={shift.id} className="border-0 shadow-sm overflow-hidden">
                <div className="h-2 w-full bg-amber-400"></div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-navy">{shift.facility.name}</h3>
                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded-md">
                      ${shift.facility.defaultRate ? Number(shift.facility.defaultRate).toFixed(0) : '45'}/hr
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        {new Date(shift.startTime).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })} 
                        {' • '}
                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span>{shift.roleRequired} Required</span>
                    </div>
                  </div>

                  <form action={acceptShift} className="mt-4">
                    <input type="hidden" name="shiftId" value={shift.id} />
                    <Button type="submit" className="w-full font-bold">Accept Shift</Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe">
        <button className="flex flex-col items-center gap-1 text-teal">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Shifts</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>

      {/* Desktop warning overlay */}
      <div className="hidden md:flex fixed inset-0 bg-navy/90 z-50 items-center justify-center p-8 text-center text-white">
        <div className="max-w-md space-y-4">
          <Stethoscope className="w-12 h-12 mx-auto text-teal" />
          <h2 className="text-2xl font-bold">Mobile View Only</h2>
          <p className="text-gray-300">The Worker App is designed specifically for mobile devices. Please shrink your browser window or open this on a phone to view the nurse interface.</p>
          <a href="/dashboard" className="inline-block mt-4 text-teal underline">Return to Admin Dashboard</a>
        </div>
      </div>
    </div>
  )
}
