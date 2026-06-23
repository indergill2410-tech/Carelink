import Link from 'next/link'
import { Heart } from 'lucide-react'

const footerLinks = [
  { href: '/our-story', label: 'Our Story' },
  { href: '/for-care-homes', label: 'For Care Homes' },
  { href: '/for-carers', label: 'For Carers' },
  { href: '/login', label: 'Sign in' },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-surface-3 bg-surface-1">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-electric shadow-btn">
                <Heart className="h-5 w-5 text-white" />
              </span>
              <span className="text-base font-black tracking-tight text-ink">Carelink</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/55">
              Trusted aged care staffing for Australia. We connect care homes with verified, qualified carers — so every shift is covered with someone you can trust.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-bold text-ink/60 hover:text-teal">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-surface-3 pt-6 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Carelink. All rights reserved.</span>
          <span>Award wages paid · Police checked · AHPRA verified</span>
        </div>
      </div>
    </footer>
  )
}
