import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { CalendarCheck, Clock, Wallet, UserCircle, TrendingUp, Building2 } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function PayPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const completedShifts = await prisma.shift.findMany({
    where: { workerId: user.id, status: 'COMPLETED' },
    include: { facility: true },
    orderBy: { startTime: 'desc' },
  })

  const shiftsWithEarnings = completedShifts.map(shift => {
    const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000
    const earnings = shift.hourlyRate * hours
    const monthKey = shift.startTime.toLocaleDateString('en-AU', {
      month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne',
    })
    return { ...shift, hours, earnings, monthKey }
  })

  const totalEarnings = shiftsWithEarnings.reduce((s, x) => s + x.earnings, 0)
  const totalHours    = shiftsWithEarnings.reduce((s, x) => s + x.hours, 0)
  const avgRate       = completedShifts.length > 0
    ? completedShifts.reduce((s, x) => s + x.hourlyRate, 0) / completedShifts.length
    : 0

  const byMonth: Record<string, { earnings: number; hours: number; count: number }> = {}
  for (const s of shiftsWithEarnings) {
    if (!byMonth[s.monthKey]) byMonth[s.monthKey] = { earnings: 0, hours: 0, count: 0 }
    byMonth[s.monthKey].earnings += s.earnings
    byMonth[s.monthKey].hours    += s.hours
    byMonth[s.monthKey].count    += 1
  }
  const monthlyData = Object.entries(byMonth).slice(0, 6).reverse()
  const maxEarnings = Math.max(...monthlyData.map(([, v]) => v.earnings), 1)

  const NAV = [
    { href: '/worker',          icon: CalendarCheck, label: 'Feed',      active: false },
    { href: '/worker/my-shifts', icon: Clock,         label: 'My Shifts', active: false },
    { href: '/worker/pay',       icon: Wallet,        label: 'Pay',       active: true  },
    { href: '/worker/profile',   icon: UserCircle,    label: 'Profile',   active: false },
  ]

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto relative">

      {/* Header */}
      <header className="relative overflow-hidden bg-ink px-6 pt-6 pb-7">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal/80 uppercase tracking-widest mb-0.5">Pay Summary</p>
            <h1 className="font-black text-white text-xl tracking-tight">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>

        {/* Total earnings hero */}
        {completedShifts.length > 0 && (
          <div className="relative mt-5">
            <p className="text-white/45 text-xs font-semibold uppercase tracking-widest mb-0.5">Total Earned</p>
            <p className="font-black text-white font-mono leading-none" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
              ${totalEarnings.toFixed(2)}
            </p>
            <p className="text-white/40 text-xs mt-1.5 font-mono">
              {totalHours.toFixed(1)}h worked · avg ${avgRate.toFixed(0)}/hr
            </p>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-5 pb-28 space-y-5">

        {completedShifts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-surface-3 mt-2">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-7 h-7 text-ink/20" />
            </div>
            <p className="font-semibold text-ink/50 text-sm">No earnings yet</p>
            <p className="text-ink/30 text-xs mt-1 px-8 leading-relaxed">
              Accept and complete shifts to see your pay history here
            </p>
          </div>
        ) : (
          <>
            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Shifts', value: completedShifts.length.toString(), suffix: '' },
                { label: 'Hours',  value: totalHours.toFixed(1),              suffix: 'h' },
                { label: 'Avg Rate', value: `$${avgRate.toFixed(0)}`,         suffix: '/hr' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-surface-2 shadow-card px-4 py-3.5 text-center">
                  <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="font-black text-ink font-mono text-lg leading-none">
                    {stat.value}
                    {stat.suffix && <span className="text-sm text-ink/50">{stat.suffix}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Monthly chart */}
            {monthlyData.length > 1 && (
              <div className="bg-white rounded-2xl border border-surface-2 shadow-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-teal" />
                  <p className="font-bold text-ink text-sm">Monthly Earnings</p>
                </div>
                <div className="flex items-end gap-2" style={{ height: '120px' }}>
                  {monthlyData.map(([month, data]) => {
                    const pct = Math.max((data.earnings / maxEarnings) * 100, 3)
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <p className="text-[9px] font-bold text-teal font-mono tabular-nums">
                          ${data.earnings >= 1000
                            ? `${(data.earnings / 1000).toFixed(1)}k`
                            : data.earnings.toFixed(0)}
                        </p>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-teal/80 to-teal transition-all duration-500"
                          style={{ height: `${pct}%` }}
                        />
                        <p className="text-[9px] text-ink/35 font-medium text-center leading-none">
                          {month.split(' ')[0]}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Shift list */}
            <section>
              <h2 className="font-bold text-ink text-sm uppercase tracking-wider mb-3">
                Completed Shifts
              </h2>
              <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden divide-y divide-surface-1">
                {shiftsWithEarnings.map((shift, i) => (
                  <div
                    key={shift.id}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface-1 transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Facility icon */}
                    <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-teal" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm leading-tight truncate">
                        {shift.facility.name}
                      </p>
                      <p className="text-xs text-ink/45 mt-0.5">
                        {shift.startTime.toLocaleDateString('en-AU', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          timeZone: 'Australia/Melbourne',
                        })}
                        {' · '}
                        <span className="font-mono">{shift.role} · {shift.hours.toFixed(1)}h</span>
                      </p>
                      {shift.clockInAt && shift.clockOutAt && (
                        <p className="text-xs text-ink/30 font-mono mt-0.5">
                          {shift.clockInAt.toLocaleTimeString('en-AU', {
                            hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
                          })}
                          {' – '}
                          {shift.clockOutAt.toLocaleTimeString('en-AU', {
                            hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne',
                          })}
                        </p>
                      )}
                    </div>

                    {/* Earnings */}
                    <div className="text-right shrink-0">
                      <p className="font-black font-mono text-emerald-600 text-sm">
                        ${shift.earnings.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-ink/30 font-mono mt-0.5">
                        ${shift.hourlyRate.toFixed(0)}/hr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-50">
        <div className="glass-light border-t border-surface-2 flex justify-around px-2 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {NAV.map(item => (
            <a key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 transition-colors ${item.active ? 'text-teal' : 'text-ink/35 hover:text-ink/60'}`}>
              <div className={`p-2 rounded-xl transition-colors ${item.active ? 'bg-teal/10' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
