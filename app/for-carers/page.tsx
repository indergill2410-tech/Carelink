import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  ShieldCheck,
  Award,
  UserCircle,
  MapPin,
  Stethoscope,
  Heart,
  DollarSign,
  Star,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Carers — Carelink',
  description:
    'Find aged-care shifts that match your qualifications, paid award wages, where and when suits you. Register as an RN, EN, or PCA with Carelink.',
  alternates: { canonical: '/for-carers' },
}

const benefits = [
  {
    icon: DollarSign,
    title: 'Award wages — guaranteed',
    body: 'Every single shift. Transparent, fair, and paid on time. No negotiating, no chasing, no surprises. Just the pay you earned for the care you gave.',
  },
  {
    icon: CalendarCheck,
    title: 'Work that fits around your life',
    body: 'Set your own availability — morning, afternoon, or night — and see only shifts that match. You choose when you work, where you work, and how much.',
  },
  {
    icon: ShieldCheck,
    title: 'One verified profile, forever',
    body: 'Upload your police check, registrations, and certificates once. We verify them and keep them current — so you\'re always ready when a shift comes up.',
  },
  {
    icon: MapPin,
    title: 'Shifts in your neighbourhood',
    body: 'See care homes near you. Spend less time on the road and more time doing the work you trained for — caring for people who need you.',
  },
  {
    icon: Heart,
    title: 'Work that means something',
    body: 'Every shift you accept puts a qualified, caring professional in front of someone who needs them. Your presence makes a real difference in real lives.',
  },
  {
    icon: Star,
    title: 'Be recognised for your excellence',
    body: 'Facilities rate you after every shift. Build a reputation that opens doors to the best care homes and the most rewarding placements.',
  },
]

const steps = [
  { num: '01', title: 'Create your profile', body: 'Choose your role — RN, EN, or PCA — add your details, and tell us when you\'re available. It takes about five minutes.' },
  { num: '02', title: 'Upload your documents', body: 'Add your police check, AHPRA registration, and any certifications. We verify them and store them securely — you only do this once.' },
  { num: '03', title: 'Accept matching shifts', body: 'Browse shifts that fit your qualifications, location, and availability. Accept with one tap and manage everything from your phone.' },
]

const roles = [
  {
    icon: Stethoscope,
    title: 'Registered Nurse (RN)',
    body: 'Lead clinical care with confidence. Your AHPRA registration is verified and displayed — so facilities know exactly who they\'re getting.',
    colour: 'bg-amber-50 text-amber-600 border-amber-100',
    dot: 'bg-amber-500',
  },
  {
    icon: Stethoscope,
    title: 'Enrolled Nurse (EN)',
    body: 'Deliver hands-on nursing care in aged care environments where your skills are genuinely valued and your contribution is felt every day.',
    colour: 'bg-sage-50 text-sage-600 border-sage-100',
    dot: 'bg-sage-500',
  },
  {
    icon: UserCircle,
    title: 'Personal Care Assistant',
    body: 'Support daily living with warmth, patience, and reliability. You are the human connection that makes residents feel safe, seen, and cared for.',
    colour: 'bg-clay-50 text-clay-600 border-clay-100',
    dot: 'bg-clay-500',
  },
]

const faqs = [
  {
    q: 'How am I paid?',
    a: 'Every shift is paid at Australian award wages — the rate for your role, with loadings for evenings, weekends, and public holidays. Transparent, fair, and automatic. No negotiating, no chasing.',
  },
  {
    q: 'What documents do I need?',
    a: 'A current police check and any registrations your role requires (AHPRA for RNs and ENs). You upload them once; we verify and store them so you\'re always ready to work.',
  },
  {
    q: 'Can I choose my own shifts?',
    a: 'Yes — completely. You see only shifts that match your qualifications and availability. You decide which ones to accept, and you can pass on any that don\'t suit you.',
  },
  {
    q: 'Can I work at multiple facilities?',
    a: 'Absolutely. Many carers build relationships with several care homes across their area. Your verified profile travels with you — there\'s nothing extra to set up.',
  },
  {
    q: 'What if I need to cancel a shift?',
    a: 'Life happens. You can manage your shifts through the app. We ask for as much notice as possible so the facility can find alternative cover for residents who are counting on it.',
  },
]

export default function ForCarersPage() {
  return (
    <main className="min-h-screen bg-surface-1 text-ink">
      <SiteNav />

      {/* ── Hero ── Split layout: copy left, photo right */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#241a12] to-[#33240f]" />
        {/* Warm glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_60%,rgba(217,119,6,0.22)_0%,transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[520px] items-center gap-0 lg:grid-cols-2">
            {/* Text */}
            <div className="py-20 sm:py-24 lg:py-28 lg:pr-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal">
                <Award className="h-3.5 w-3.5" />
                For carers
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                You show up when it&nbsp;matters most.
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/70 sm:text-xl">
                You chose this work because you care. Carelink makes sure that every hour you give is recognised, verified, and paid — fairly, always, without exception.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-teal px-7 text-base font-black text-ink shadow-glow transition-all hover:-translate-y-0.5 hover:bg-mint"
                >
                  Join as a carer
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/our-story"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 text-base font-black text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Our story
                </Link>
              </div>
              {/* Trust strip */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-7">
                {[
                  { icon: ShieldCheck, label: 'Police checked' },
                  { icon: Award, label: 'Award wages — always' },
                  { icon: CalendarCheck, label: 'You set your hours' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-sm font-bold text-white/65">
                    <Icon className="h-4 w-4 text-teal" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Photo — hidden on mobile, shown on desktop */}
            <div className="relative hidden h-full lg:block">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'center 25%' }}
              />
              {/* Fade left into the dark section */}
              <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/20 to-transparent" />
              {/* Bottom vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-ink/20" />
              {/* Floating badge */}
              <div className="absolute bottom-10 left-8 right-8 glass-dark rounded-2xl px-5 py-4">
                <p className="text-xs font-black uppercase tracking-widest text-teal/80">Award wages — guaranteed</p>
                <p className="mt-1 text-xl font-black text-white">Fair pay, every shift, no exceptions.</p>
                <p className="mt-1 text-sm text-white/55">Weekend, night, and public holiday loadings — automatic.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pay guarantee strip ── */}
      <section className="border-b border-surface-3 bg-surface-0 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3.5">
            <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
            <span className="font-black text-emerald-800 text-lg">Award wages paid for every shift</span>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink/55">
            Weekend loadings. Night penalty rates. Public holiday pay. All calculated automatically — you never have to ask, negotiate, or follow up.
          </p>
        </div>
      </section>

      {/* ── Real human strip ── Photo with overlay quote */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'center 40%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/75 to-ink/50" />
        <div className="relative px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Why it matters</p>
            <blockquote className="mt-5 max-w-2xl text-2xl font-black leading-snug text-white sm:text-3xl lg:text-4xl">
              &ldquo;Every morning when I walk through that door, I know I&apos;m exactly where I&apos;m supposed to be.&rdquo;
            </blockquote>
            <p className="mt-4 text-base text-white/55 font-semibold">Sarah K. — Registered Nurse, Melbourne</p>
            <div className="mt-8 flex flex-wrap gap-4">
              {[
                'Pick shifts that suit you',
                'Get paid what you\'re owed',
                'Build a career you\'re proud of',
              ].map(item => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-bold text-white/80 backdrop-blur-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">What you get</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Built around the way you want to work.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-ink/55">
            Carelink isn&apos;t just another agency. It&apos;s a platform that puts you in control — of your time, your income, and your career.
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

      {/* ── Roles ── */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Your role</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Every qualification. Every level of care.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-ink/55">
            Whether you lead clinical care or provide personal support, Carelink matches you to shifts that fit your training — not one above it, never one below.
          </p>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {roles.map(({ icon: Icon, title, body, colour, dot }) => (
              <div key={title} className="rounded-[24px] border border-surface-3 bg-surface-0 p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${colour}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                </div>
                <h3 className="mt-5 text-lg font-black tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal">
            <Clock className="h-4 w-4" />
            Getting started
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Three steps to your first shift.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-ink/55">
            From sign-up to your first shift can take less than 24 hours. Most carers accept their first shift within a week.
          </p>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map(({ num, title, body }) => (
              <div key={num} className="rounded-[24px] border border-surface-3 bg-surface-0 p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <span className="text-3xl font-black text-teal/30 font-mono">{num}</span>
                <h3 className="mt-4 text-xl font-black tracking-tight">{title}</h3>
                <p className="mt-3 leading-7 text-ink/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Income reassurance ── Dark band */}
      <section className="bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Your income, secured</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                Consistent shifts. Transparent pay. No surprises.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
                You can plan your life around Carelink. Every shift shows you the expected pay before you accept. Weekend and night loadings are built in. Public holidays are calculated automatically. When the shift ends, your earnings are on record.
              </p>
            </div>
            <div className="flex flex-col gap-4 lg:items-end lg:justify-center">
              {[
                { label: 'Evening loading', value: '+15%' },
                { label: 'Weekend rate', value: '+25%' },
                { label: 'Public holiday', value: '+150%' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3.5">
                  <span className="text-sm font-bold text-white/60">{label}</span>
                  <span className="font-black font-mono text-xl text-teal">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-surface-0 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal mb-2">What carers say</p>
          <h2 className="mb-10 max-w-xl text-2xl font-black tracking-tight">Real words from real carers.</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                quote: "I pick shifts around my family, and I actually earn what I&apos;m worth. No agency mark-ups, no calls at 5am asking me to cover — I&apos;m in control.",
                name: 'Sarah K.',
                role: 'Registered Nurse',
                city: 'Melbourne',
                initial: 'S',
              },
              {
                quote: "My documents are all in one spot. I uploaded them once, and every facility I work with already has everything they need before I arrive.",
                name: 'Michael T.',
                role: 'Enrolled Nurse',
                city: 'Sydney',
                initial: 'M',
              },
              {
                quote: "Award wages, every time. I can see exactly what I&apos;ll earn before I accept. That kind of transparency was missing from every other agency I&apos;d used.",
                name: 'Lisa B.',
                role: 'Personal Care Assistant',
                city: 'Brisbane',
                initial: 'L',
              },
            ].map(({ quote, name, role, city, initial }) => (
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
                    <p className="text-xs text-ink/45">{role} · {city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 lg:px-8">
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
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-6 py-14 text-center text-white shadow-modal sm:px-10">
            {/* Background photo subtle overlay */}
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center"
              style={{ backgroundImage: "url('/hero-care.jpg')", backgroundPosition: 'center 30%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/50" />
            <div className="relative">
              <Sparkles className="mx-auto h-7 w-7 text-teal mb-4" />
              <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Start doing the work you love — on your terms.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                Join carers across Australia who choose where they work, when they work, and get paid every time what they actually deserve.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-teal px-8 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:bg-mint shadow-glow"
                >
                  Join as a carer
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/for-care-homes"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-8 text-base font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/12"
                >
                  For care homes
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
