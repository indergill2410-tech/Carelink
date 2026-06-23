'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, ShieldCheck, CheckCircle2, Award } from 'lucide-react'

const navLinks = [
  { href: '/our-story', label: 'Our Story' },
  { href: '/for-care-homes', label: 'For Care Homes' },
  { href: '/for-carers', label: 'For Carers' },
]

const ribbonItems = [
  { icon: ShieldCheck, label: 'Police checked' },
  { icon: CheckCircle2, label: 'AHPRA verified' },
  { icon: Award, label: 'Award wages — always' },
]

export default function SiteNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50">
      {/* Trust ribbon — slim strip that signals credibility above the nav */}
      <div className="hidden border-b border-white/10 bg-[#160f08] md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {ribbonItems.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70">
                <Icon className="h-3.5 w-3.5 text-teal" />
                {label}
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-white/55">Australian aged care staffing</span>
        </div>
      </div>

      {/* Main nav — solid, blurred, bordered, shadowed so it's always clearly visible */}
      <nav className="border-b border-white/10 bg-ink/95 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Carelink home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-electric shadow-btn">
              <Heart className="h-5 w-5 text-white" />
            </span>
            <span className="text-base font-black tracking-tight text-white">Carelink</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map(link => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-white/65 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/8 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-teal px-4 py-2 text-sm font-black text-ink shadow-btn transition-all hover:-translate-y-0.5 hover:bg-mint"
            >
              Try demo
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
