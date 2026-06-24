import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  Users,
  Activity,
  Clock,
  CheckCircle2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Story — Carelink',
  description:
    'Why Carelink exists: to make sure every older Australian gets consistent, compassionate care from verified, fairly-paid carers.',
  alternates: { canonical: '/our-story' },
}

const values = [
  {
    icon: ShieldCheck,
    title: 'Verified before day one',
    body: 'Every carer has their qualifications, registrations, and police check confirmed before they can accept a single shift. No exceptions.',
  },
  {
    icon: Heart,
    title: 'Dignity at the centre',
    body: 'Older Australians deserve to be cared for by someone who is present, prepared, and genuinely kind. That belief drives every match we make.',
  },
  {
    icon: Users,
    title: 'People, not users',
    body: 'Carers and care homes are partners. We back our carers with fair pay and clear communication, and we back care homes with reliable coverage.',
  },
  {
    icon: Activity,
    title: 'Always accountable',
    body: 'From the moment a shift is posted to when it is completed, every step is visible and tracked — so nothing falls through the cracks.',
  },
]

const steps = [
  { num: '01', title: 'A care home posts a shift', body: 'Planned or urgent, it takes under two minutes to request the role they need.' },
  { num: '02', title: 'We match a verified carer', body: 'Carelink finds an available carer whose qualifications and compliance fit the shift.' },
  { num: '03', title: 'Care is delivered, tracked, recorded', body: 'The shift is covered, documented, and ready for audit — with award wages paid.' },
]

const stats = [
  { value: '200+', label: 'Verified carers' },
  { value: '40+', label: 'Care homes served' },
  { value: '5,000+', label: 'Shifts filled' },
  { value: '100%', label: 'Award wages paid' },
]

export default function OurStoryPage() {
  return (
    <main className="min-h-screen bg-surface-1 text-ink">
      <SiteNav />

      {/* ── Hero with full bleed photo background ── */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* Photo layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'center 20%' }}
        />
        {/* Strong overlay — text must be readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
        {/* Warm amber glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(217,119,6,0.18)_0%,transparent_50%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Our story</p>
            <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              Every older Australian deserves consistent, compassionate care.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
              Carelink was built because understaffing in aged care is a real, daily problem — with real consequences for residents, families, and the carers who show up every day. We exist to close that gap.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-7">
              {[
                'Verified carers, always',
                'Award wages, no exceptions',
                'Dignity at every shift',
              ].map(item => (
                <span key={item} className="inline-flex items-center gap-2 text-sm font-bold text-white/65">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The problem / mission ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">The problem we set out to solve</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Understaffing in aged care isn&apos;t just an inconvenience. It&apos;s a crisis.
            </h2>
            <p className="mt-5 leading-8 text-ink/60">
              Across Australia, care homes routinely face shifts they can&apos;t fill. When that happens, residents miss out on the attention they need, families worry, and the carers on the floor are stretched too thin to do their best work.
            </p>
            <p className="mt-4 leading-8 text-ink/60">
              The old way of fixing this — frantic phone calls, agency mark-ups, and unverified fill-ins — wasn&apos;t good enough. We knew there was a better way: a trusted network of verified carers, matched to the right shift, quickly and fairly.
            </p>
            <p className="mt-4 leading-8 text-ink/60">
              So we built Carelink. Not as a staffing agency. As a trust infrastructure for aged care — where everyone in the chain is verified, compensated fairly, and held accountable.
            </p>
          </div>
          <div className="rounded-[28px] border border-surface-3 bg-surface-0 p-8 shadow-card">
            <Heart className="h-8 w-8 text-teal" />
            <h3 className="mt-5 text-2xl font-black tracking-tight">What we believe</h3>
            <p className="mt-4 leading-8 text-ink/60">
              Good care depends on the right person being there. That person needs to be verified, fairly paid, and genuinely supported — not scrambled in at the last minute through an agency that takes a cut from both sides.
            </p>
            <p className="mt-4 leading-8 text-ink/60">
              When carers are treated well, residents are treated well. It&apos;s not a coincidence. It&apos;s how care works.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/for-carers"
                className="inline-flex items-center gap-2 text-sm font-black text-teal hover:gap-3 transition-all"
              >
                For carers <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/for-care-homes"
                className="inline-flex items-center gap-2 text-sm font-black text-teal hover:gap-3 transition-all"
              >
                For care homes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo strip midway through ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'center 50%' }}
        />
        <div className="absolute inset-0 bg-ink/75" />
        <div className="relative px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">What drives us</p>
            <p className="mt-5 text-2xl font-black leading-snug text-white sm:text-3xl lg:text-4xl">
              &ldquo;The carer who shows up matters. The care that follows matters. We make sure the right person always shows up.&rdquo;
            </p>
            <p className="mt-5 text-sm font-bold text-white/50">— The Carelink team</p>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Our principles</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">What we stand for</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[24px] border border-surface-3 bg-surface-0 p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-teal">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">The process</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">How Carelink works</h2>
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

      {/* ── Stats ── with photo background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#241a12] to-[#33240f]" />
        <div
          className="absolute inset-0 opacity-12 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-care.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-ink/60" />
        <div className="relative px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-teal mb-10">Carelink by the numbers</p>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-8 backdrop-blur-sm">
                  <p className="text-4xl font-black tracking-tight text-teal sm:text-5xl">{value}</p>
                  <p className="mt-2 text-sm font-bold text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── For carers teaser ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-surface-3 bg-surface-0 p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">For carers</p>
              <h3 className="mt-4 text-2xl font-black tracking-tight">Your skills. Your schedule. Your pay — guaranteed.</h3>
              <p className="mt-4 leading-7 text-ink/58">
                Find shifts that match your qualifications and availability. Award wages paid for every hour you work — with evening, weekend, and public holiday loadings built in.
              </p>
              <Link href="/for-carers" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-teal hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-[28px] border border-surface-3 bg-surface-0 p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">For care homes</p>
              <h3 className="mt-4 text-2xl font-black tracking-tight">Verified coverage in minutes. Compliance handled automatically.</h3>
              <p className="mt-4 leading-7 text-ink/58">
                Post a shift in under two minutes. Get a verified, qualified carer matched to your requirements. Audit-ready records kept for every shift you fill.
              </p>
              <Link href="/for-care-homes" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-teal hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-surface-3 bg-surface-0 px-6 py-12 text-center shadow-card sm:px-10">
          <Clock className="mx-auto h-8 w-8 text-teal" />
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Care never waits. Neither do we.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-ink/58">
            Whether you run a care home or work as a carer, Carelink is built to make aged care staffing work the way it should — reliably, fairly, and with people at the centre.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/for-care-homes"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal px-7 py-3.5 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:bg-mint shadow-glow"
            >
              For Care Homes
            </Link>
            <Link
              href="/for-carers"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-surface-3 bg-surface-1 px-7 py-3.5 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:bg-surface-2"
            >
              For Carers
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
