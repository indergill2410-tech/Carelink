import { MapPin, Clock, Calendar, CheckCircle2, ChevronRight, Activity } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default function WorkerApp() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans pb-24">
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-white/50 mb-1">Good evening,</p>
            <h1 className="text-2xl font-medium tracking-tight">Worker Demo</h1>
          </div>
          <LogoutButton />
        </div>
        <div className="bg-white/5 border border-white/10 p-1 rounded-full flex relative">
          <div className="w-1/2 text-center py-2 text-sm font-medium bg-[#1A1A1A] rounded-full shadow-sm shadow-black border border-white/5 text-amber-500">Available</div>
          <div className="w-1/2 text-center py-2 text-sm font-medium text-white/40 hover:text-white/70 cursor-pointer">Do Not Disturb</div>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-8">
        <ShiftFeed />
      </main>

      <nav className="fixed bottom-0 w-full bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-6 flex justify-between items-center h-20">
        <div className="flex flex-col items-center gap-1 text-amber-500">
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">SHIFTS</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">SCHEDULE</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">COMPLETED</span>
        </div>
      </nav>
    </div>
  )
}

async function ShiftFeed() {
  const availableShifts = await prisma.shift.findMany({
    where: {
      status: 'PENDING',
      startTime: { gt: new Date() }
    },
    include: { facility: true },
    orderBy: { startTime: 'asc' }
  })

  return { user: dbUser, availableShifts, myShifts }
}

export default async function WorkerPortal({ searchParams }: { searchParams: { error?: string } }) {
  const { user, availableShifts, myShifts } = await getWorkerData()
  const errorMessage = searchParams.error

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

  const formatTime = (date: Date) => date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
  const formatDate = (date: Date) => date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium tracking-widest uppercase text-white/40">Available Near You</h2>
        <span className="text-xs text-amber-500 cursor-pointer">Filter</span>
      </div>

      <div className="space-y-3">
        {availableShifts.map((shift) => (
          <div key={shift.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex justify-between mb-3">
              <h3 className="font-medium text-white/90">General Ward ({shift.role})</h3>
              <span className="text-emerald-400 text-sm font-medium">${shift.hourlyRate.toFixed(2)}/hr</span>
            </div>
            <div className="space-y-2 mb-5 text-sm text-white/50">
              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formatDate(shift.startTime)}</div>
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {formatTime(shift.startTime)} - {formatTime(shift.endTime)}</div>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {shift.facility?.name || 'Unknown Facility'}</div>
            </div>
            <button className="w-full py-3 bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 text-white rounded-xl text-sm font-medium transition-colors border border-white/5 flex items-center justify-center gap-2">
              Accept Shift <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex-1">
            <p className="text-xs text-teal-100">Shifts This Week</p>
            <p className="text-sm font-semibold mt-1">{myShifts.length}</p>
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMessage === 'compliance_required'
              ? 'You must be fully compliant before accepting shifts. Please upload your documents.'
              : errorMessage === 'shift_already_taken'
              ? 'This shift was just taken by another worker. Please choose a different shift.'
              : (() => {
                  try {
                    return decodeURIComponent(errorMessage);
                  } catch {
                    return errorMessage;
                  }
                })()}
          </div>
        )}
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
    </section>
  )
}
