import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Clock, CalendarPlus, AlertTriangle, CheckCircle2, Users, TrendingUp } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { signOut } from '@/app/login/actions'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ROLE_RATES: Record<string, number> = {
  NURSE: 55.00,
  EN: 45.00,
  PCA: 32.50,
}

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
    facility = await prisma.$transaction(async tx => {
      const f = await tx.facility.create({
        data: { name: `${dbUser.name ?? 'My'} Facility`, address: 'Address to be configured' },
      })
      await tx.user.update({ where: { id: dbUser.id }, data: { facilityId: f.id } })
      return f
    })
  }

  const shifts = await prisma.shift.findMany({
    where: { facilityId: facility.id },
    include: { worker: true },
    orderBy: { startTime: 'desc' },
    take: 50,
  })

  return { facility, shifts }
}

export default async function FacilityPortal({
  searchParams,
}: {
  searchParams: { error?: string; tab?: string }
}) {
  const { facility, shifts } = await getFacilityData()
  const error = searchParams.error
  const activeTab = searchParams.tab ?? 'shifts'

  const pending = shifts.filter(s => s.status === 'PENDING')
  const matched = shifts.filter(s => s.status === 'MATCHED' || s.status === 'CLOCKED_IN')
  const completed = shifts.filter(s => s.status === 'COMPLETED')
  const totalSpend = completed.reduce((sum, s) => {
    const hrs = (s.endTime.getTime() - s.startTime.getTime()) / 3_600_000
    return sum + s.hourlyRate * hrs
  }, 0)

  async function cancelShift(formData: FormData) {
    'use server'
    const shiftId = formData.get('shiftId') as string
    if (!shiftId) return
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift || shift.facilityId !== facility.id) return
    await prisma.shift.update({ where: { id: shiftId }, data: { status: 'CANCELLED' } })
    revalidatePath('/facility')
  }

  async function requestShift(formData: FormData) {
    'use server'
    const role = formData.get('role') as string
    const date = formData.get('date') as string
    const startT = (formData.get('startTime') as string) || '07:00'
    const endT = (formData.get('endTime') as string) || '15:00'
    const rateRaw = formData.get('hourlyRate') as string
    const notes = (formData.get('notes') as string) || null
    const urgent = formData.get('urgent') === 'on'

    if (!role || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      redirect('/facility?error=Invalid+shift+details')
    }

    const startTime = new Date(`${date}T${startT}:00+10:00`)
    const endTime = new Date(`${date}T${endT}:00+10:00`)

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || startTime >= endTime) {
      redirect('/facility?error=Invalid+time+range')
    }

    const hourlyRate = parseFloat(rateRaw) || ROLE_RATES[role] || 45.00

    await prisma.shift.create({
      data: {
        facilityId: facility.id,
        role: role as Role,
        startTime,
        endTime,
        hourlyRate,
        notes: notes || null,
        urgent,
        status: 'PENDING',
      },
    })

    revalidatePath('/facility')
    revalidatePath('/dashboard')
    redirect('/facility')
  }

  const statusStyle: Record<string, string> = {
    PENDING:    'bg-amber-100 text-amber-800',
    MATCHED:    'bg-teal-100 text-teal-800',
    CLOCKED_IN: 'bg-blue-100 text-blue-800',
    COMPLETED:  'bg-green-100 text-green-800',
    CANCELLED:  'bg-gray-100 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-navy">{facility.name}</h1>
            <p className="text-sm text-gray-500">{facility.address}</p>
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">Sign Out</Button>
        </form>
      </header>

      {/* KPI Strip */}
      <div className="bg-white border-b px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500">Awaiting Staff</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-teal-600">{matched.length}</p>
          <p className="text-xs text-gray-500">Confirmed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{completed.length}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-navy">${totalSpend.toFixed(0)}</p>
          <p className="text-xs text-gray-500">Total Spend</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="bg-white border-b px-6 flex gap-6">
        {[
          { id: 'shifts', label: 'Shift Requests', icon: Clock },
          { id: 'roster', label: 'Live Roster', icon: Users },
          { id: 'history', label: 'History', icon: TrendingUp },
        ].map(tab => (
          <a
            key={tab.id}
            href={`/facility?tab=${tab.id}`}
            className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-teal text-teal'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </a>
        ))}
      </div>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {decodeURIComponent(error)}
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Request Form */}
            <div className="md:col-span-1">
              <Card className="shadow-sm border-0 ring-1 ring-gray-100">
                <CardHeader className="bg-navy text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarPlus className="w-4 h-4" /> New Shift Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <form action={requestShift} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Role Needed</label>
                      <select name="role" className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required>
                        <option value="NURSE">Registered Nurse (RN) — ${ROLE_RATES.NURSE}/hr</option>
                        <option value="EN">Enrolled Nurse (EN) — ${ROLE_RATES.EN}/hr</option>
                        <option value="PCA">Personal Care Assistant — ${ROLE_RATES.PCA}/hr</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</label>
                      <input type="date" name="date" className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start</label>
                        <input type="time" name="startTime" defaultValue="07:00" className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">End</label>
                        <input type="time" name="endTime" defaultValue="15:00" className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hourly Rate ($)</label>
                      <input type="number" name="hourlyRate" step="0.50" min="20" max="200" placeholder="Leave blank for default" className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes (optional)</label>
                      <textarea name="notes" rows={2} maxLength={500} placeholder="Special requirements or instructions…" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none" />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" name="urgent" className="rounded" />
                      <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Mark as Urgent
                      </span>
                    </label>

                    <Button type="submit" className="w-full font-bold">Broadcast Request</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Shift List */}
            <div className="md:col-span-2 space-y-3">
              <h2 className="font-bold text-navy text-lg">Active Requests</h2>
              {[...pending, ...matched].length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
                  <CalendarPlus className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No active shift requests. Use the form to broadcast a new one.</p>
                </div>
              ) : (
                [...pending, ...matched].map(shift => (
                  <div key={shift.id} className={`flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow ${shift.urgent ? 'border-red-200 bg-red-50/30' : ''}`}>
                    <div className="flex gap-3 items-center min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${statusStyle[shift.status]}`}>
                        {shift.role}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-navy text-sm truncate">
                            {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                          </p>
                          {shift.urgent && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">URGENT</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' – '}
                          {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' · $'}{shift.hourlyRate.toFixed(0)}/hr
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {shift.worker
                            ? <span className="text-teal-700 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3 inline" /> {shift.worker.name ?? shift.worker.email}</span>
                            : 'Awaiting worker'}
                        </p>
                        {shift.notes && <p className="text-xs text-gray-400 mt-0.5 italic truncate">{shift.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle[shift.status]}`}>
                        {shift.status}
                      </span>
                      {(shift.status === 'PENDING' || shift.status === 'MATCHED') && (
                        <form action={cancelShift}>
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <Button type="submit" variant="destructive" size="sm" className="text-xs h-7">Cancel</Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="space-y-4">
            <h2 className="font-bold text-navy text-lg">Live Roster — Confirmed Staff</h2>
            {matched.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No confirmed staff at the moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matched.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-4 bg-white border rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700 text-sm">
                        {shift.worker?.name?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-navy text-sm">{shift.worker?.name ?? 'Worker'}</p>
                        <p className="text-xs text-gray-500">
                          {shift.role} · {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                          {' '}
                          {shift.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          {' – '}
                          {shift.endTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                        </p>
                        {shift.clockInAt && (
                          <p className="text-xs text-blue-600 font-medium">
                            Clocked in {shift.clockInAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle[shift.status]}`}>
                      {shift.status === 'CLOCKED_IN' ? 'On Duty' : shift.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="font-bold text-navy text-lg">Shift History</h2>
            {completed.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
                <p className="text-gray-500 text-sm">No completed shifts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completed.map(shift => {
                  const hrs = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
                  const cost = shift.hourlyRate * hrs
                  return (
                    <div key={shift.id} className="flex items-center justify-between p-4 bg-white border rounded-xl">
                      <div>
                        <p className="font-semibold text-navy text-sm">
                          {shift.role} · {shift.startTime.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne' })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {shift.worker?.name ?? 'Unknown'} · {hrs.toFixed(1)}h @ ${shift.hourlyRate}/hr
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-sm">${cost.toFixed(2)}</p>
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">COMPLETED</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
