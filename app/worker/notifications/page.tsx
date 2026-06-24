import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Bell, CheckCheck, ArrowRight } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { WorkerBottomNav } from '@/components/worker/WorkerBottomNav'

export const dynamic = 'force-dynamic'

const TZ = 'Australia/Melbourne'

function dayKey(d: Date) {
  const p = new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).formatToParts(d)
  const by = Object.fromEntries(p.map(x => [x.type, x.value]))
  return `${by.year}-${by.month}-${by.day}`
}
function relative(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: TZ })
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  async function markAllRead() {
    'use server'
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    await prisma.notification.updateMany({ where: { userId: authUser.id, read: false }, data: { read: true } })
    revalidatePath('/worker/notifications')
  }

  const unread = notifications.filter(n => !n.read).length
  const todayKey = dayKey(new Date())
  const today = notifications.filter(n => dayKey(n.createdAt) === todayKey)
  const earlier = notifications.filter(n => dayKey(n.createdAt) !== todayKey)

  function Item({ n }: { n: typeof notifications[number] }) {
    const body = (
      <div className={`flex gap-3 p-4 rounded-2xl border transition-colors ${n.read ? 'bg-white border-surface-3' : 'bg-teal/5 border-teal/20'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-surface-2 text-ink/35' : 'bg-teal/15 text-teal'}`}>
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm leading-tight ${n.read ? 'font-semibold text-ink/80' : 'font-bold text-ink'}`}>{n.title}</p>
            {!n.read && <span className="w-2 h-2 rounded-full bg-teal shrink-0" />}
          </div>
          <p className="text-ink/55 text-xs mt-1 leading-relaxed">{n.body}</p>
          <p className="text-ink/30 text-[11px] mt-1.5 font-medium">{relative(n.createdAt)}</p>
        </div>
        {n.link && <ArrowRight className="w-4 h-4 text-ink/25 shrink-0 self-center" />}
      </div>
    )
    return n.link ? <a href={n.link} className="block">{body}</a> : body
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto">
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
        <div className="relative px-5 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal/80 text-xs font-semibold tracking-widest uppercase mb-0.5">Notifications</p>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </h1>
            </div>
            <LogoutButton />
          </div>
          {unread > 0 && (
            <form action={markAllRead} className="mt-4">
              <button className="inline-flex items-center gap-1.5 glass px-3 py-2 rounded-xl text-white/80 text-xs font-bold hover:bg-white/10 transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 space-y-5 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-surface-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-ink/25" />
            </div>
            <p className="font-bold text-ink text-sm">No notifications yet</p>
            <p className="text-ink/40 text-xs mt-1 text-center px-8">Shift offers, confirmations, and pay updates will show up here.</p>
            <a href="/worker/shifts" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline">
              Find shifts <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <section>
                <h2 className="font-bold text-ink/40 text-[11px] uppercase tracking-widest mb-2.5">Today</h2>
                <div className="space-y-2.5">{today.map(n => <Item key={n.id} n={n} />)}</div>
              </section>
            )}
            {earlier.length > 0 && (
              <section>
                <h2 className="font-bold text-ink/40 text-[11px] uppercase tracking-widest mb-2.5">Earlier</h2>
                <div className="space-y-2.5">{earlier.map(n => <Item key={n.id} n={n} />)}</div>
              </section>
            )}
          </>
        )}
      </main>

      <WorkerBottomNav />
    </div>
  )
}
