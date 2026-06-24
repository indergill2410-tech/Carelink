'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FileWarning, Users, Building2, TrendingUp,
  Heart, ArrowRight,
} from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { PostShiftModal } from '@/components/dashboard/PostShiftModal'
import { signOut } from '@/app/login/actions'

export type SidebarCounts = {
  pendingDocs: number
  unfilledShifts: number
  expiringDocs: number
  expiredDocs: number
  certAlerts: number
}

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, section: 'Operations' },
  { href: '/dashboard/certifications', label: 'Certifications', icon: FileWarning, section: 'Operations' },
  { href: '/dashboard/care-team', label: 'Care Team', icon: Users, section: 'People' },
  { href: '/dashboard/care-homes', label: 'Care Homes', icon: Building2, section: 'People' },
  { href: '/dashboard/insights', label: 'Insights', icon: TrendingUp, section: 'Analytics' },
] as const

function badgeFor(href: string, c: SidebarCounts): number {
  if (href === '/dashboard') return c.unfilledShifts
  if (href === '/dashboard/certifications') return c.certAlerts
  return 0
}

export function DashboardShell({
  title,
  eyebrow = 'Overview',
  counts,
  facilities,
  children,
}: {
  title: string
  eyebrow?: string
  counts: SidebarCounts
  facilities: { id: string; name: string }[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const sections = Array.from(new Set(NAV.map(n => n.section)))

  return (
    <div className="flex min-h-screen bg-surface-1">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-ink hidden md:flex flex-col shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />

        <div className="relative flex flex-col h-full p-5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-electric flex items-center justify-center shadow-btn shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight tracking-tight">Carelink</p>
              <p className="text-white/30 text-[10px] font-medium">Operations Console</p>
            </div>
          </div>

          <nav className="flex flex-col gap-5 flex-1">
            {sections.map(section => (
              <div key={section}>
                <p className="px-3.5 mb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/25">{section}</p>
                <div className="flex flex-col gap-0.5">
                  {NAV.filter(n => n.section === section).map(item => {
                    const active = isActive(item.href)
                    const badge = badgeFor(item.href, counts)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative',
                          active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/5',
                        ].join(' ')}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal rounded-r-full" style={{ boxShadow: '0 0 8px rgba(217,119,6,0.8)' }} />
                        )}
                        <item.icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${active ? 'text-teal' : 'text-white/30 group-hover:text-white/60'}`} />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center leading-none shrink-0">
                            {badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/5 pt-4 mt-4">
            <form action={signOut}>
              <button type="submit" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/30 hover:text-rose-400 hover:bg-white/5 transition-all duration-150 text-sm font-medium text-left">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="sticky top-0 z-20 bg-surface-0/80 backdrop-blur-xl border-b border-surface-2 px-5 sm:px-8 py-4 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <p className="text-label text-ink/40">{eyebrow}</p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-ink leading-tight truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell tone="light" />
            <PostShiftModal facilities={facilities} />
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">{children}</div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-light border-t border-surface-2 z-40">
        <div className="flex justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {NAV.map(item => {
            const active = isActive(item.href)
            const badge = badgeFor(item.href, counts)
            return (
              <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-0.5 transition-colors ${active ? 'text-teal' : 'text-ink/35'}`}>
                <div className={`p-2 rounded-xl ${active ? 'bg-teal/10' : ''}`}>
                  <item.icon className="w-[18px] h-[18px]" />
                  {badge > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />}
                </div>
                <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
