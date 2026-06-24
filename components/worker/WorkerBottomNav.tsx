'use client'

import { usePathname } from 'next/navigation'
import { Home, Search, Clock, Wallet, UserCircle } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/worker',           icon: Home,       label: 'Home'      },
  { href: '/worker/shifts',    icon: Search,     label: 'Find'      },
  { href: '/worker/my-shifts', icon: Clock,      label: 'My Shifts' },
  { href: '/worker/pay',       icon: Wallet,     label: 'Pay'       },
  { href: '/worker/profile',   icon: UserCircle, label: 'Profile'   },
] as const

export function WorkerBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-50">
      <div className="glass-light border-t border-surface-2 flex justify-around px-2 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/worker'
            ? pathname === '/worker'
            : pathname.startsWith(item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 transition-colors ${active ? 'text-teal' : 'text-ink/35 hover:text-ink/60'}`}
            >
              <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-teal/10' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
