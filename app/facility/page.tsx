import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Clock, CalendarPlus } from 'lucide-react'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// We fetch the logged-in user, and find their associated Facility
async function getFacilityData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // In a real app, you'd link the User table to the Facility table.
  // For the MVP, we'll just grab the first facility, or create a mock one.
  let facility = await prisma.facility.findFirst()
  if (!facility) {
    facility = await prisma.facility.create({
      data: { name: 'Melbourne Care Home', defaultRate: 85.00 }
    })
  }

  const liveShifts = await prisma.shift.findMany({
    where: { facilityId: facility.id },
    include: { worker: true },
    orderBy: { startTime: 'desc' },
    take: 5
  })

  return { facility, liveShifts, userId: user.id }
}

export default async function FacilityPortal() {
  const { facility, liveShifts } = await getFacilityData()

  // Server Action to Post a Shift
  async function requestShift(formData: FormData) {
    'use server'
    const role = formData.get('role') as string
    const date = formData.get('date') as string

    // Defaulting to an 8-hour shift starting at 7 AM
    const startTime = new Date(`${date}T07:00:00`)
    const endTime = new Date(`${date}T15:00:00`)

    await prisma.shift.create({
      data: {
        facilityId: facility.id,
        roleRequired: role,
        startTime,
        endTime,
        status: 'REQUESTED'
      }
    })

    revalidatePath('/facility')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
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
        <Button variant="outline">Sign Out</Button>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Request Form */}
        <div className="md:col-span-1 space-y-6">
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
                    <option value="RN">Registered Nurse (RN)</option>
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

        {/* Right Column: Live Roster */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" /> Active & Upcoming Shifts
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
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${shift.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                          {shift.roleRequired}
                        </div>
                        <div>
                          <p className="font-bold text-navy">
                            {new Date(shift.startTime).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-500">
                            7:00 AM - 3:00 PM · {shift.worker ? shift.worker.name : 'Awaiting worker'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          shift.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' : 
                          shift.status === 'CLOCKED_IN' ? 'bg-mint text-white ring-1 ring-mint' : 
                          'bg-teal-100 text-teal-800 ring-1 ring-teal-200'
                        }`}>
                          {shift.status}
                        </span>
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
