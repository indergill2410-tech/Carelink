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
  Zap,
  Star,
  Lock,
  LineChart,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Care Homes — Carelink',
  description:
    'Staff your roster with confidence. Carelink fills planned and urgent aged-care shifts with verified, compliant carers — and keeps you audit-ready.',
  alternates: { canonical: '/for-care-homes' },
}

const benefits = [
  {
    icon: Zap,
    title: 'Fill shifts in minutes, not hours',
    body: 'Post a planned or urgent shift and Carelink matches an available, verified carer fast. No phone calls. No agency waiting games. Coverage before handover.',
  },
  {
    icon: ShieldCheck,
    title: 'Only verified carers, every time',
    body: 'Every carer on Carelink arrives police checked, with AHPRA registration and mandatory training confirmed in date. You see their status before you accept.',
  },
  {
    icon: ClipboardCheck,
    title: 'Stay compliant automatically',
    body: 'Credentials are tracked and kept current. You\'re never placed at risk by a lapsed certificate or an expired registration. Audit-ready records, always.',
  },
  {
    icon: Users,
    title: 'Full visibility across every shift',
    body: 'See who is confirmed, who is on shift, and who completed each day — in real time, from any device. Nothing slips through.',
  },
  {
    icon: LineChart,
    title: 'Understand your staffing patterns',
    body: 'Track fill rates, shift coverage, carer ratings, and role distribution over time. Identify gaps before they become problems.',
  },
  {
    icon: Star,
    title: 'Rate carers, build your preferred team',
    body: 'After every shift, rate the carer. Over time, you build a trusted pool who know your facility, your residents, and how you work.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Post a shift',
    body: 'Choose the role — RN, EN, or PCA — set the date, time, and any notes. It takes under two minutes, even for urgent cover.',
  },
  {
    num: '02',
    title: 'We match a verified carer',
    body: 'Carelink finds an available carer whose qualifications, credentials, and compliance status fit your requirements. You see who\'s confirmed before they arrive.',
  },
  {
    num: '03',
    title: 'Track, review, stay compliant',
    body: 'Watch coverage live. When the shift ends, every record — carer, credentials, time, completion — is stored and audit-ready.',
  },
]

const faqs = [
  {
    q: 'How quickly can a shift be filled?',
    a: 'Most shifts are matched within minutes. Urgent gaps are handled with priority — we know that care can\'t wait for a slow process.',
  },
  {
    q: 'How do you verify carers?',
    a: 'Every carer uploads their police check, qualifications, and registrations (including AHPRA for RNs and ENs). We verify them before they can accept a single shift. You can see their compliance status at a glance.',
  },
  {
    q: 'What if a carer\'s credentials expire?',
    a: 'Carelink tracks expiry dates and flags carers whose credentials are approaching expiry. A carer with lapsed credentials cannot accept shifts — so you\'re protected automatically.',
  },
  {
    q: 'What roles can I request?',
    a: 'Registered Nurses (RN), Enrolled Nurses (EN), and Personal Care Assistants (PCA). Each role is matched based on the qualifications your shift requires.',
  },
  {
    q: 'Are compliance records kept for audits?',
    a: 'Yes. Every shift generates a record: the carer, their verified credentials, the times, and the completion. All accessible, all audit-ready, for as long as you need them.',
  },
]

export default function ForCareHomesPage() {
  return (
    <main className="min-h-screen bg-surface-1 text-ink">
      <SiteNav />

      {/* ── Hero ── Split: copy left, photo right */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#1e1812] to-[#2c1f0e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_70%,rgba(217,119,6,0.20)_0%,transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[520px] items-center gap-0 lg:grid-cols-2">
            {/* Text */}
            <div className="py-20 sm:py-24 lg:py-28 lg:pr-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal">
                <Building2 className="h-3.5 w-3.5" />
                For care homes
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Reliable cover for every shift. Every&nbsp;time.
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/70 sm:text-xl">
                Whether it&apos;s a planned roster or an urgent gap at 6am, Carelink finds you a verified, qualified carer — so your residents are never left waiting.
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
              {/* Mini trust strip */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-7">
                {[
                  { icon: ShieldCheck, label: 'Police checked' },
                  { icon: Lock, label: 'Audit-ready records' },
                  { icon: Clock, label: 'Shifts filled in minutes' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-sm font-bold text-white/65">
                    <Icon className="h-4 w-4 text-teal" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div className="relative hidden h-full lg:block">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'right center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/20" />
              {/* Floating compliance badge */}
              <div className="absolute bottom-10 left-8 right-8 glass-dark rounded-2xl px-5 py-4">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400/80">Compliance — automatic</p>
                <p className="mt-1 text-xl font-black text-white">Verified credentials before every shift.</p>
                <p className="mt-1 text-sm text-white/50">Police checks · AHPRA · Mandatory training — all tracked.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The peace-of-mind strip ── */}
      <section className="border-b border-surface-3 bg-surface-0 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-black text-ink">Every carer. Fully verified.</p>
              <p className="text-sm text-ink/50">Police check · AHPRA · Mandatory training</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['No unverified fill-ins', 'Audit-ready records', 'Credentials tracked automatically'].map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Manager quote strip with photo background ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'center 55%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-ink/92 via-ink/70 to-ink/40" />
        <div className="relative px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex justify-end">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">What care managers tell us</p>
              <blockquote className="mt-5 text-2xl font-black leading-snug text-white sm:text-3xl">
                &ldquo;An urgent gap at 6am used to mean two hours of phone calls. With Carelink, a verified RN was confirmed before handover.&rdquo;
              </blockquote>
              <p className="mt-4 text-base text-white/55 font-semibold">Aged Care Manager — Melbourne facility</p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { value: '< 2 min', label: 'To post a shift' },
                  { value: '100%', label: 'Verified carers' },
                  { value: '24/7', label: 'Shifts available' },
                ].map(({ value, label }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-center backdrop-blur-sm">
                    <p className="font-black font-mono text-xl text-teal">{value}</p>
                    <p className="mt-1 text-xs font-bold text-white/50">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">What you get</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            We take the stress out of staffing.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-ink/58">
            Post a shift, and we do the rest. Carelink matches you with qualified carers who are available, verified, and ready — so you never have to scramble.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[24px] border border-surface-3 bg-surface-0 p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300">
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

      {/* ── Compliance callout ── */}
      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-6 rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-7 sm:p-9 lg:grid-cols-[auto_1fr_auto]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <FileCheck2 className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-xl font-black tracking-tight sm:text-2xl">
                Never staffing a shift with someone who isn&apos;t cleared to work.
              </h3>
              <p className="mt-2 max-w-2xl leading-7 text-ink/60">
                Every carer arrives with their police check, AHPRA registration, and mandatory training verified and in date. We track the expiry dates so you don&apos;t have to. Credentials lapse — the carer drops off your available pool automatically. No gaps, no risk, no awkward conversations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
              {['Police checks current', 'AHPRA verified', 'Mandatory training tracked', 'Audit-ready records'].map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-surface-0 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal">
            <CalendarClock className="h-4 w-4" />
            How it works
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            From shift posted to shift covered — in minutes.
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map(({ num, title, body }) => (
              <div key={num} className="rounded-[24px] border border-surface-3 bg-surface-0 p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <span className="text-3xl font-black font-mono text-teal/30">{num}</span>
                <h3 className="mt-4 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 leading-7 text-ink/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-surface-0 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal mb-2">What care homes say</p>
          <h2 className="mb-10 max-w-xl text-2xl font-black tracking-tight">Trusted by managers who can&apos;t afford surprises.</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                quote: "We had an urgent gap at 6am. A verified RN was confirmed before handover. That kind of reliability changes everything.",
                name: 'Aged Care Manager',
                role: 'Melbourne facility',
                initial: 'A',
              },
              {
                quote: "The compliance records alone are worth it. I know before every shift that whoever walks through our door is cleared, verified, and ready to work.",
                name: 'Director of Care',
                role: 'Sydney facility',
                initial: 'D',
              },
              {
                quote: "Posting a shift used to take two hours of calls. Now it takes two minutes, and I know the person coming in has been properly vetted.",
                name: 'Roster Coordinator',
                role: 'Brisbane facility',
                initial: 'R',
              },
            ].map(({ quote, name, role, initial }) => (
              <div key={name} className="rounded-[24px] border border-surface-3 bg-surface-1 p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-ink/65 italic">&ldquo;{quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/15 text-sm font-black text-teal">
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-black text-ink">{name}</p>
                    <p className="text-xs text-ink/45">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Questions</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Everything you need to know.</h2>
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

      {/* ── CTA ── */}
      <section className="relative overflow-hidden px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-6 py-14 text-center text-white shadow-modal sm:px-10">
            <div
              className="absolute inset-0 opacity-15 bg-cover bg-center"
              style={{ backgroundImage: "url('/hero-care.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/60" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Reliable coverage for every shift.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/58 sm:text-lg">
                Join the care homes that trust Carelink to keep their roster full, their residents cared for, and their compliance airtight — every single day.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-teal px-8 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:bg-mint shadow-glow"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/for-carers"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-8 text-base font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/12"
                >
                  For carers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
