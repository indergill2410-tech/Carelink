'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Heart, ShieldCheck, CheckCircle2, Award, Menu, X, Building2, UserCircle } from 'lucide-react'

const navLinks = [
  { href: '/our-story',       label: 'Our Story'      },
  { href: '/for-care-homes',  label: 'For Care Homes' },
  { href: '/for-carers',      label: 'For Carers'     },
]

const ribbonItems = [
  { icon: ShieldCheck,   label: 'Police checked'       },
  { icon: CheckCircle2,  label: 'AHPRA verified'       },
  { icon: Award,         label: 'Award wages — always' },
]

export default function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50">
      {/* Trust ribbon */}
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

      {/* Main nav */}
      <nav className="border-b border-white/10 bg-ink/95 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Carelink home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-electric shadow-btn">
              <Heart className="h-5 w-5 text-white" />
            </span>
            <span className="text-base font-black tracking-tight text-white">Carelink</span>
          </Link>

          {/* Desktop nav links */}
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

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/8 hover:text-white md:block"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="hidden items-center justify-center rounded-xl bg-teal px-4 py-2 text-sm font-black text-ink shadow-btn transition-all hover:-translate-y-0.5 hover:bg-mint md:inline-flex"
            >
              Try demo
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(v => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-white/10 bg-ink/98 px-4 pb-5 pt-4 md:hidden">
            {/* Trust items */}
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 border-b border-white/8 pb-4">
              {ribbonItems.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50">
                  <Icon className="h-3 w-3 text-teal" />
                  {label}
                </span>
              ))}
            </div>

            {/* Nav links */}
            <div className="space-y-1">
              {navLinks.map(link => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-white/65 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    {link.href === '/for-care-homes' && <Building2 className="h-4 w-4 shrink-0 text-teal" />}
                    {link.href === '/for-carers'     && <UserCircle className="h-4 w-4 shrink-0 text-teal" />}
                    {link.href === '/our-story'      && <Heart       className="h-4 w-4 shrink-0 text-teal" />}
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* CTA row */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-white/8 pt-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl border border-white/15 text-sm font-bold text-white/70 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl bg-teal text-sm font-black text-ink transition-all hover:bg-mint"
              >
                Try demo
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
