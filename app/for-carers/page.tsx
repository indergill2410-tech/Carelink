import type { Metadata } from 'next'
import Link from 'next/link'
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
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Carers — Carelink',
  description:
    'Find aged-care shifts that match your qualifications, paid award wages, where and when suits you. Register as an RN, EN, or PCA with Carelink.',
  alternates: { canonical: '/for-carers' },
}

const benefits = [
  { icon: Award, title: 'Award wages — always', body: 'Every shift is paid at award wages. Fair, transparent, no exceptions and no chasing.' },
  { icon: CalendarCheck, title: 'Work that fits your life', body: 'See shifts that match your qualifications and pick the ones that suit your schedule and location.' },
  { icon: ShieldCheck, title: 'One verified profile', body: 'Keep your police check, registrations, and certificates in one place — verified once, ready for every shift.' },
  { icon: MapPin, title: 'Shifts near you', body: 'Find care homes in your area so you spend less time travelling and more time doing what you do best.' },
]

const steps = [
  { num: '01', title: 'Create your profile', body: 'Choose your role — RN, EN, or PCA — so shift matching starts with the right fit.' },
  { num: '02', title: 'Upload your documents', body: 'Add your police check, registrations, and certificates. We verify them so you are ready to work.' },
  { num: '03', title: 'Accept matching shifts', body: 'Browse available shifts, confirm the details, and manage your roster from your phone.' },
]

const roles = [
  { icon: Stethoscope, title: 'Registered Nurse (RN)', body: 'Lead clinical care with AHPRA registration confirmed.' },
  { icon: Stethoscope, title: 'Enrolled Nurse (EN)', body: 'Deliver hands-on nursing care under supervision.' },
  { icon: UserCircle, title: 'Personal Care Assistant', body: 'Support daily living with warmth and reliability.' },
]

const faqs = [
  { q: 'How am I paid?', a: 'Every shift is paid at award wages — fair and transparent, with no need to negotiate or chase.' },
  { q: 'What documents do I need?', a: 'A current police check, any required registrations (AHPRA for RNs and ENs), and your relevant certificates. You upload them once and we verify them.' },
  { q: 'Can I choose my own shifts?', a: 'Yes. You only see shifts that match your qualifications, and you decide which ones to accept based on time and location.' },
  { q: 'Do I manage everything from my phone?', a: 'Yes — browse, accept, and manage your roster from mobile, wherever you are.' },
]

export default function ForCarersPage() {
  return (
    <main className="min-h-screen bg-surface-1 text-ink">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(217,119,6,0.18)_0%,transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal">
            <Award className="h-3.5 w-3.5" />
            For carers
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
            Your skills deserve fair pay and real opportunities.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            Whether you&apos;re a Registered Nurse, Enrolled Nurse, or Personal Care Assistant, Carelink puts shifts in front of you that match your qualifications — with award wages paid, always.
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
        </div>
      </section>

      {/* Pay guarantee strip */}
      <section className="border-b border-surface-3 bg-surface-2 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span className="font-black text-emerald-800">Award wages paid for every shift</span>
          </div>
          <p className="text-sm leading-6 text-ink/55">
            No hidden deductions, no negotiating rates on the day — just fair pay you can count on.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Built around the way you want to work.</h2>
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

      {/* Roles */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Roles we match</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {roles.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[24px] border border-surface-3 bg-surface-0 p-7 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-black tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal">
            <Clock className="h-4 w-4" />
            Getting started
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Three steps to your first shift.</h2>
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

      {/* Testimonials */}
      <section className="bg-surface-0 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal mb-8">What carers say</p>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { quote: "I pick shifts around my family. No agency hassle — just real shifts with real pay.", name: 'Sarah K.', role: 'Registered Nurse' },
              { quote: "My documents are all in one spot. I upload once and never have to scramble before a shift.", name: 'Michael T.', role: 'Enrolled Nurse' },
              { quote: "Award wages, every time. No negotiating, no surprises. Exactly what I needed.", name: 'Lisa B.', role: 'Personal Care Assistant' },
            ].map(({ quote, name, role }) => (
              <div key={name} className="rounded-[24px] border border-surface-3 bg-surface-1 p-6 shadow-card">
                <p className="text-sm leading-7 text-ink/65 italic">&ldquo;{quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/15 text-xs font-black text-teal">
                    {name[0]}
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

      {/* FAQ */}
      <section className="bg-surface-2 px-4 py-20 sm:px-6 lg:px-8">
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
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-6 py-12 text-center text-white shadow-modal sm:px-10">
          <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
            Find your next shift today.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/58">
            Join carers across Australia who choose where they work, when they work, and get paid award wages every time.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-teal px-7 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:bg-mint"
          >
            Join as a carer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
