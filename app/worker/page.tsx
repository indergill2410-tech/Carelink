import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Stethoscope, CalendarCheck, Wallet, UserCircle, Clock } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { LogoutButton } from '@/components/LogoutButton'
import { AcceptShiftSchema } from '@/lib/validations'

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
    orderBy: { startTime: 'asc' },
  })

  const myShifts = await prisma.shift.findMany({
    where: { workerId: user.id },
    include: { facility: true },
    orderBy: { startTime: 'asc' },
  })

  return { user: dbUser, availableShifts, myShifts }
}

export default async function WorkerPortal({ searchParams }: { searchParams: { error?: string } }) {
  const { user, availableShifts, myShifts } = await getWorkerData()
  const errorMessage = searchParams.error

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

    const result = await prisma.shift.updateMany({
      where: {
        id: parsed.data.shiftId,
        workerId: null,
        status: 'PENDING',
      },
      data: {
        workerId: dbUser.id,
        status: 'MATCHED',
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
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto shadow-card">
      {/* Mobile Header */}
      <header className="mesh-hero text-white px-6 py-6 rounded-b-[2rem] shadow-modal">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-electric font-medium">Welcome back,</p>
            <h1 className="font-bold text-xl">{user.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-6 flex gap-4">
          <div className="bg-white/10 rounded-2xl p-3 flex-1 ring-1 ring-white/10 backdrop-blur-xl">
            <p className="text-xs text-slate-300">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${user.complianceStatus === 'GREEN' ? 'bg-green-400' : 'bg-rose-400'}`}></div>
              <span className="text-sm font-semibold text-white">
                {user.complianceStatus === 'GREEN' ? 'Compliant' : 'Upload Docs'}
              </span>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 flex-1 ring-1 ring-white/10 backdrop-blur-xl">
            <p className="text-xs text-slate-300">My Shifts</p>
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
              ? 'That shift was just taken by another worker. Please choose a different one.'
              : decodeURIComponent(errorMessage)}
          </div>
        )}

        <h2 className="font-bold text-ink mb-4 text-lg">Available Shifts Near You</h2>

        {availableShifts.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-6 w-6" />}
            title="No open shifts right now"
            description="New requests from nearby facilities will appear here."
          />
        ) : (
          <div className="space-y-4">
            {availableShifts.map(shift => (
              <Card key={shift.id} className="overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-electric to-pulse-blue"></div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-ink">{shift.facility.name}</h3>
                    <span className="bg-electric/10 text-electric-dim text-xs font-bold px-2 py-1 rounded-lg number-tabular">
                      ${shift.hourlyRate.toFixed(0)}/hr
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        {new Date(shift.startTime).toLocaleDateString('en-AU', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          timeZone: 'Australia/Melbourne',
                        })}
                        {' • '}
                        {new Date(shift.startTime).toLocaleTimeString('en-AU', {
                          hour: '2-digit', minute: '2-digit',
                          timeZone: 'Australia/Melbourne',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span>{shift.role} Required</span>
                      <StatusBadge status="PENDING" className="ml-auto" />
                    </div>
                  </div>

                  <form action={acceptShift} className="mt-4">
                    <input type="hidden" name="shiftId" value={shift.id} />
                    <Button
                      type="submit"
                      className="w-full font-bold"
                      disabled={user.complianceStatus !== 'GREEN'}
                    >
                      {user.complianceStatus === 'GREEN' ? 'Accept Shift' : 'Complete Compliance First'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[min(92vw,40rem)] -translate-x-1/2 justify-around rounded-3xl border border-white/70 bg-white/85 p-2 shadow-hover backdrop-blur-xl">
        <a href="/worker" className="flex flex-col items-center gap-1 rounded-2xl bg-electric/10 px-4 py-2 text-electric-dim">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
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
