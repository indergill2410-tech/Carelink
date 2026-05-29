import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Clock, CalendarPlus } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { signOut } from '@/app/login/actions'
import { ShiftRequestSchema } from '@/lib/validations'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic';

async function getFacilityData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/login')

  let facility = null

  if (dbUser.facilityId) {
    facility = await prisma.facility.findUnique({ where: { id: dbUser.facilityId } })
  }

  if (!facility) {
    facility = await prisma.$transaction(async (tx) => {
      const newFacility = await tx.facility.create({
        data: { name: `${dbUser.name ?? 'My'} Facility`, address: 'Address to be configured' },
      })
      await tx.user.update({
        where: { id: dbUser.id },
        data: { facilityId: newFacility.id },
      })
      return newFacility
    })
  }

  const liveShifts = await prisma.shift.findMany({
    where: { facilityId: facility.id },
    include: { worker: true },
    orderBy: { startTime: 'desc' },
    take: 10,
  })

  return { facility, liveShifts }
}

const ROLE_RATES: Record<string, number> = {
  NURSE: 55.00,
  EN: 45.00,
  PCA: 32.50,
}

export default async function FacilityPortal({ searchParams }: { searchParams: { error?: string } }) {
  const { facility, liveShifts } = await getFacilityData()
  const error = searchParams.error

  async function cancelShift(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string;
    if (!shiftId) return;

    // Security: verify shift belongs to this facility before cancelling
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.facilityId !== facility.id) return;

    await prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'CANCELLED' },
    });

    revalidatePath('/facility');
  }

  async function requestShift(formData: FormData) {
    'use server'
    const parsed = ShiftRequestSchema.safeParse({
      role: formData.get('role'),
      date: formData.get('date'),
    })
    if (!parsed.success) redirect('/facility?error=Invalid+shift+details')

    const { role, date } = parsed.data
    const startTime = new Date(`${date}T07:00:00.000+10:00`)
    const endTime = new Date(`${date}T15:00:00.000+10:00`)
    const hourlyRate = ROLE_RATES[role] ?? 45.00

    try {
      await prisma.shift.create({
        data: {
          facilityId: facility.id,
          role: role as Role,
          startTime,
          endTime,
          hourlyRate,
          status: 'PENDING',
        },
      })
    } catch {
      redirect('/facility?error=Failed+to+create+shift')
    }

    revalidatePath('/facility')
    revalidatePath('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-navy">{facility.name}</h1>
            <p className="text-sm text-gray-500">Client Portal</p>
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">Sign Out</Button>
        </form>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {decodeURIComponent(error)}
            </div>
          )}
          <Card className="shadow-lg border-0 ring-1 ring-gray-100">
            <CardHeader className="bg-navy text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5" /> Request Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form action={requestShift} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Role Needed</label>
                  <select name="role" className="w-full flex h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required>
                    <option value="NURSE">Registered Nurse (RN)</option>
                    <option value="EN">Enrolled Nurse (EN)</option>
                    <option value="PCA">Personal Care Assistant (PCA)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy">Date</label>
                  <input type="date" name="date" className="w-full flex h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full h-12 text-lg shadow-md">Broadcast Request</Button>
                  <p className="text-xs text-center text-gray-500 mt-3">Local agency staff will be notified instantly.</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" /> Active &amp; Upcoming Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveShifts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                  <p className="text-gray-500">No active shift requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveShifts.map(shift => (
                    <div key={shift.id} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:border-teal transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${shift.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                          {shift.role}
                        </div>
                        <div>
                          <p className="font-bold text-navy">
                            {new Date(shift.startTime).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                          </p>
                          <p className="text-sm text-gray-500">
                            7:00 AM - 3:00 PM · {shift.worker ? shift.worker.name : 'Awaiting worker'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          shift.status === 'PENDING' ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' :
                          shift.status === 'MATCHED' ? 'bg-mint text-white ring-1 ring-mint' :
                          'bg-teal-100 text-teal-800 ring-1 ring-teal-200'
                        }`}>
                          {shift.status}
                        </span>
                        {(shift.status === 'PENDING' || shift.status === 'MATCHED') && (
                          <form action={cancelShift}>
                            <input type="hidden" name="shiftId" value={shift.id} />
                            <Button type="submit" variant="destructive" size="sm">Cancel</Button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
