import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ClipboardCheck,
  FileCheck2,
  Users,
  CalendarClock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Care Homes — Carelink',
  description:
    'Staff your roster with confidence. Carelink fills planned and urgent aged-care shifts with verified, compliant carers — and keeps you audit-ready.',
  alternates: { canonical: '/for-care-homes' },
}

const benefits = [
  { icon: Clock, title: 'Fill shifts in minutes', body: 'Post a planned or urgent shift and we match an available, verified carer fast — so coverage never lapses.' },
  { icon: ShieldCheck, title: 'Only verified carers', body: 'Every carer arrives police checked, with qualifications and registrations confirmed before they accept.' },
  { icon: ClipboardCheck, title: 'Stay compliant', body: 'Police checks, AHPRA registration, and mandatory training are kept current and on file for every carer.' },
  { icon: Users, title: 'Full visibility', body: 'See who is on shift in real time, track filled and open shifts, and review completed work in one place.' },
]

const steps = [
  { num: '01', title: 'Post a shift', body: 'Choose the role — RN, EN, or PCA — set the time, and add any notes. It takes under two minutes.' },
  { num: '02', title: 'We match a carer', body: 'Carelink finds an available, verified carer whose qualifications fit. You see their role and compliance before they start.' },
  { num: '03', title: 'Track and review', body: 'Watch coverage live, then review completed shifts with audit-ready records kept for you automatically.' },
]

const faqs = [
  { q: 'How quickly can a shift be filled?', a: 'Most shifts are matched within minutes. Urgent gaps are prioritised so coverage never lapses.' },
  { q: 'How do you verify carers?', a: 'Every carer completes police checks, uploads qualifications and registrations (including AHPRA for RNs and ENs), and is reviewed before they can accept any shift.' },
  { q: 'What about compliance records?', a: 'We keep current credentials and a record of every shift you fill, so you are always ready for internal review or an external audit.' },
  { q: 'What roles can I request?', a: 'Registered Nurses (RN), Enrolled Nurses (EN), and Personal Care Assistants (PCA).' },
]

export default function ForCareHomesPage() {
  return (
    <main className="min-h-screen bg-surface-1 text-ink">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(217,119,6,0.18)_0%,transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal">
            <Building2 className="h-3.5 w-3.5" />
            For care homes
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
            Staff your roster with confidence.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Whether it&apos;s a planned shift or an urgent gap, Carelink finds you a verified carer who&apos;s ready to work — so you can focus on your residents, not your roster.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-teal px-7 text-base font-black text-ink shadow-glow transition-all hover:-translate-y-0.5 hover:bg-mint"
            >
              Try live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/our-story"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 text-base font-black text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/15"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">We take the stress out of staffing.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-ink/58">
            Post a shift, and we do the rest. Carelink matches you with qualified carers who are available, verified, and ready — so you never have to scramble.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[24px] border border-surface-3 bg-surface-0 p-7 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-teal">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 leading-7 text-ink/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance callout */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-6 rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-7 sm:p-9 lg:grid-cols-[auto_1fr_auto]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <FileCheck2 className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-xl font-black tracking-tight sm:text-2xl">
                We help your facility stay compliant — where it matters most.
              </h3>
              <p className="mt-2 max-w-2xl leading-7 text-ink/60">
                Every carer arrives with their police check, AHPRA registration, and mandatory training verified and in date. We keep the records, so you&apos;re always ready for an audit and never staffing a shift with someone who isn&apos;t cleared to work.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
              {['Police checks current', 'AHPRA verified', 'Audit-ready records'].map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-surface-0 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal">
            <CalendarClock className="h-4 w-4" />
            How it works
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">From shift posted to shift covered.</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map(({ num, title, body }) => (
              <div key={num} className="rounded-[24px] border border-surface-3 bg-surface-0 p-7 shadow-card">
                <span className="text-sm font-black text-teal">{num}</span>
                <h3 className="mt-4 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 leading-7 text-ink/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Questions, answered</h2>
          <div className="mt-10 space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-[20px] border border-surface-3 bg-surface-0 p-6 shadow-card">
                <h3 className="text-lg font-black tracking-tight">{q}</h3>
                <p className="mt-2 leading-7 text-ink/58">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-6 py-12 text-center text-white shadow-modal sm:px-10">
          <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
            Reliable coverage for every shift.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/58">
            Join the care homes that trust Carelink to keep their roster full and their compliance airtight.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-teal px-7 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:bg-mint"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
