import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { CalendarDays, Clock, MapPin, ArrowRight } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { WorkerBottomNav } from '@/components/worker/WorkerBottomNav'
import { calculateShiftPay } from '@/lib/pay-engine'

export const dynamic = 'force-dynamic'

const TZ = 'Australia/Melbourne'

const STATUS_META: Record<string, { label: string; dot: string; chip: string }> = {
  MATCHED:    { label: 'Confirmed',   dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  CLOCKED_IN: { label: 'In progress', dot: 'bg-blue-500',    chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED:  { label: 'Completed',   dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED:  { label: 'Cancelled',   dot: 'bg-stone-400',   chip: 'bg-surface-2 text-ink/45 border-surface-3' },
}

function dayKey(d: Date) {
  const p = new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).formatToParts(d)
  const by = Object.fromEntries(p.map(x => [x.type, x.value]))
  return `${by.year}-${by.month}-${by.day}`
}
function dayHeading(d: Date) {
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
}
function timeRange(a: Date, b: Date) {
  const t = (d: Date) => d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  return `${t(a)} – ${t(b)}`
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const now = new Date()
  const shifts = await prisma.shift.findMany({
    where: { workerId: user.id, status: { in: ['MATCHED', 'CLOCKED_IN', 'COMPLETED', 'CANCELLED'] } },
    include: { facility: { select: { name: true, address: true } } },
    orderBy: { startTime: 'asc' },
  })

  const upcoming = shifts.filter(s => ['MATCHED', 'CLOCKED_IN'].includes(s.status) && s.endTime >= now)
  const todayKey = dayKey(now)

  // Group upcoming by Melbourne day for the agenda view.
  const groups = new Map<string, { date: Date; items: typeof shifts }>()
  for (const s of upcoming) {
    const k = dayKey(s.startTime)
    if (!groups.has(k)) groups.set(k, { date: s.startTime, items: [] })
    groups.get(k)!.items.push(s)
  }
  const orderedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  const confirmedHours = upcoming.reduce((sum, s) => sum + calculateShiftPay(s).hours, 0)

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto">
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
        <div className="relative px-5 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal/80 text-xs font-semibold tracking-widest uppercase mb-0.5">Schedule</p>
              <h1 className="text-2xl font-black tracking-tight text-white">Your roster</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <LogoutButton />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="glass rounded-xl p-3">
              <p className="text-white/45 text-[10px] font-semibold uppercase tracking-wider mb-1">Upcoming shifts</p>
              <p className="text-white text-lg font-black font-mono leading-none">{upcoming.length}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-white/45 text-[10px] font-semibold uppercase tracking-wider mb-1">Confirmed hours</p>
              <p className="text-white text-lg font-black font-mono leading-none">{confirmedHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 space-y-5 overflow-y-auto">
        {orderedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-surface-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
              <CalendarDays className="w-7 h-7 text-ink/25" />
            </div>
            <p className="font-bold text-ink text-sm">No upcoming shifts</p>
            <p className="text-ink/40 text-xs mt-1 text-center px-8">Accept an offer and it&apos;ll appear here, ready to add to your calendar.</p>
            <a href="/worker/shifts" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline">
              Find shifts <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        ) : (
          orderedGroups.map(([key, group]) => (
            <section key={key}>
              <div className="flex items-center gap-2 mb-2.5">
                <h2 className="font-bold text-ink text-sm tracking-tight">{dayHeading(group.date)}</h2>
                {key === todayKey && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Today</span>
                )}
              </div>
              <div className="space-y-3">
                {group.items.map(shift => {
                  const meta = STATUS_META[shift.status] ?? STATUS_META.MATCHED
                  const pay = calculateShiftPay(shift)
                  const gcalStart = shift.startTime.toISOString().replace(/[-:]|\.\d{3}/g, '')
                  const gcalEnd = shift.endTime.toISOString().replace(/[-:]|\.\d{3}/g, '')
                  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Carelink — ${shift.role} @ ${shift.facility.name}`)}&dates=${gcalStart}/${gcalEnd}&location=${encodeURIComponent(shift.facility.address)}`
                  return (
                    <div key={shift.id} className="bg-white rounded-2xl border border-surface-3 shadow-card overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-ink text-base leading-tight">{shift.facility.name}</p>
                          <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${meta.chip}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                          </span>
                        </div>
                        <div className="mt-2.5 space-y-1.5 text-sm text-ink/60">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                            <span className="font-medium">{timeRange(shift.startTime, shift.endTime)} <span className="text-ink/35">({pay.hours.toFixed(1)}h)</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-ink/30 shrink-0" />
                            <span className="truncate">{shift.facility.address}</span>
                          </div>
                        </div>
                        <div className="mt-3.5 flex gap-2.5">
                          <a href="/worker/my-shifts" className="flex-1 h-10 rounded-xl bg-ink text-white text-sm font-bold flex items-center justify-center">
                            Manage shift
                          </a>
                          <a href={gcal} target="_blank" rel="noopener noreferrer" className="h-10 px-3.5 rounded-xl border border-surface-3 text-ink/55 text-sm font-bold flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4" /> Add
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </main>

      <WorkerBottomNav />
    </div>
  )
}
