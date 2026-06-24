'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Heart, LayoutGrid, Radio, Users, ShieldCheck, BarChart2, CreditCard, History, Settings } from 'lucide-react'
import { NotificationBell } from '@/components/NotificationBell'
import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import type { FacilityKPIs } from '@/app/facility/_data'

type FacilityInfo = { id: string; name: string; address: string }

const TABS = [
  { label: 'Request Staff', href: '/facility', icon: LayoutGrid, exact: true },
  { label: 'Live Board', href: '/facility/shifts', icon: Radio },
  { label: 'Care Team', href: '/facility/care-team', icon: Users },
  { label: 'Compliance', href: '/facility/compliance', icon: ShieldCheck },
  { label: 'Analytics', href: '/facility/analytics', icon: BarChart2 },
  { label: 'Billing', href: '/facility/billing', icon: CreditCard },
  { label: 'History', href: '/facility?tab=history', icon: History, paramTab: 'history' },
  { label: 'Settings', href: '/facility?tab=settings', icon: Settings, paramTab: 'settings' },
] as const

export function FacilityShell({
  facility,
  kpis,
  children,
}: {
  facility: FacilityInfo
  kpis: FacilityKPIs
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  function isActive(tab: typeof TABS[number]): boolean {
    if ('paramTab' in tab && tab.paramTab) {
      return pathname === '/facility' && tabParam === (tab as { paramTab: string }).paramTab
    }
    if ('exact' in tab && tab.exact) {
      return pathname === '/facility' && (tabParam === null || tabParam === '')
    }
    return pathname !== '/facility' && pathname.startsWith(tab.href)
  }

  const KPI_ITEMS = [
    { label: 'Awaiting Staff', value: kpis.awaiting.toString(), color: 'text-amber-600' },
    { label: 'Confirmed',      value: kpis.confirmed.toString(), color: 'text-emerald-600' },
    { label: 'Completed',      value: kpis.completed.toString(), color: 'text-ink/70' },
    { label: 'Care Hours',     value: `${kpis.totalHours.toFixed(0)}h`, color: 'text-amber-600' },
    { label: 'Fill Rate',      value: `${kpis.fillRate}%`, color: kpis.fillRate >= 80 ? 'text-emerald-600' : kpis.fillRate >= 50 ? 'text-amber-600' : 'text-rose-600' },
  ]

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-surface-2 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3.5 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-electric-dim flex items-center justify-center shadow-btn shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink text-sm leading-tight truncate">{facility.name}</p>
                <p className="text-ink/40 text-[11px] leading-tight truncate hidden sm:block">{facility.address}</p>
              </div>
            </div>

            {/* Desktop KPI strip */}
            <div className="hidden lg:flex items-center gap-6">
              {KPI_ITEMS.map(k => (
                <div key={k.label} className="text-center">
                  <p className={`text-lg font-black font-mono leading-none ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-ink/35 leading-none mt-0.5 whitespace-nowrap">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <NotificationBell tone="light" />
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm" className="text-xs h-8 hidden sm:flex">Sign Out</Button>
              </form>
            </div>
          </div>

          {/* Mobile KPI strip */}
          <div className="lg:hidden grid grid-cols-5 border-t border-surface-2 -mx-5 sm:-mx-8 px-1">
            {KPI_ITEMS.map(k => (
              <div key={k.label} className="py-2 text-center">
                <p className={`text-sm font-black font-mono leading-none ${k.color}`}>{k.value}</p>
                <p className="text-[9px] text-ink/35 mt-0.5 leading-none px-0.5 truncate">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Tab nav */}
          <div className="flex gap-0 overflow-x-auto scrollbar-hide -mx-1 px-1 border-t border-surface-2">
            {TABS.map(tab => {
              const active = isActive(tab)
              return (
                <a
                  key={tab.href}
                  href={tab.href}
                  className={[
                    'flex items-center gap-1.5 px-3 py-3 text-[11px] font-semibold whitespace-nowrap transition-colors relative shrink-0',
                    active ? 'text-teal' : 'text-ink/40 hover:text-ink/70',
                  ].join(' ')}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal rounded-full" />
                  )}
                </a>
              )
            })}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 py-6">
        {children}
      </main>

      {/* ── Trust footer ── */}
      <footer className="border-t border-surface-2 bg-white/60">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-ink/35 font-medium">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> All carers are police-checked</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> AHPRA-registered nurses verified</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Compliance-screened before every shift</span>
          <span className="ml-auto text-ink/20">Award wages apply</span>
        </div>
      </footer>
    </div>
  )
}
