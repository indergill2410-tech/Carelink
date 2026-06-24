import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Heart,
  ShieldCheck,
  UserCheck,
  Users,
  Activity,
  Award,
  ClipboardCheck,
  FileCheck2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Carelink — Trusted Aged Care Staffing',
  description:
    'Carelink connects Australian aged care facilities with verified, qualified carers. Trusted staffing, award wages, verified credentials — built for dignity in care.',
}

const trustSignals = [
  { icon: ShieldCheck, label: 'Background Checked',         detail: 'Every carer is police checked before joining' },
  { icon: CheckCircle2, label: 'Qualifications Verified',   detail: 'AHPRA registration and documents confirmed' },
  { icon: Heart, label: 'Award Wages — Always',             detail: 'We pay fairly, every shift, no exceptions' },
  { icon: Clock, label: 'Real-time Matching',               detail: 'Open shifts filled fast, so care never waits' },
]

const facilityBenefits = [
  'Post a shift request in under 2 minutes',
  'We match you with a verified, qualified carer',
  'Stay compliant — every carer\'s checks and registrations are current',
  'Track who\'s on shift in real time',
  'Audit-ready records for every shift you fill',
]

const workerBenefits = [
  'See shifts that match your qualifications',
  'Award wages paid — transparent and fair',
  'Work where and when suits you',
  'Your credentials and profile in one place',
]

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-ink/58 sm:text-lg">{body}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-surface-1 text-ink">
      <SiteNav />
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {/* Warm amber base */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#241a12] to-[#33240f]" />

        {/* Hero photo — full-bleed across the whole hero, no seam */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-care.jpg')" }}
          />
          {/* Single smooth horizontal fade — solid on the left for text, clear photo on the right.
              Custom stops keep it buttery with no visible line. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(26,20,15,0.95) 0%, rgba(26,20,15,0.88) 24%, rgba(26,20,15,0.55) 40%, rgba(26,20,15,0.14) 56%, rgba(26,20,15,0) 70%)',
            }}
          />
          {/* Gentle bottom + top vignette so edges feel finished, not heavy */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/15" />
          {/* Soft amber warmth on the photo for a premium, brand-tinted glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_38%,rgba(217,119,6,0.16)_0%,transparent_58%)] mix-blend-soft-light" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal">
              <ShieldCheck className="h-3.5 w-3.5" />
              Australian aged care staffing — built for trust
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Dignified care starts with the&nbsp;right carer
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/72 sm:text-xl">
              Carelink connects Australian aged care homes with verified, qualified carers — so every shift is covered with someone you can trust.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/for-care-homes"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-teal px-7 text-base font-black text-ink shadow-glow transition-all hover:-translate-y-0.5 hover:bg-mint"
              >
                For Care Homes
                <Building2 className="h-4 w-4" />
              </Link>
              <Link
                href="/for-carers"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 text-base font-black text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/15"
              >
                For Carers
                <Heart className="h-4 w-4" />
              </Link>
            </div>

            {/* Inline trust strip — replaces the floating centered console */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-7">
              {[
                { icon: ShieldCheck, label: 'Police checked' },
                { icon: CheckCircle2, label: 'AHPRA verified' },
                { icon: Award, label: 'Award wages — always' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-sm font-bold text-white/70">
                  <Icon className="h-4 w-4 text-teal" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-b border-surface-3 bg-surface-1">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustSignals.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex items-start gap-3 rounded-2xl px-2 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-1 text-teal">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-ink">{label}</span>
                <span className="mt-1 block text-xs font-medium leading-5 text-ink/48">{detail}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-surface-0 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: '< 2 min', label: 'To post a shift' },
              { value: 'RN · EN · PCA', label: 'Roles matched' },
              { value: '100%', label: 'Award wages paid' },
              { value: '24 / 7', label: 'Shifts available' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-surface-3 bg-surface-1 px-5 py-6 text-center shadow-card">
                <p className="font-black text-ink font-mono text-xl sm:text-2xl tracking-tight">{value}</p>
                <p className="mt-1.5 text-xs font-semibold text-ink/45 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Our story</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                We believe every older Australian deserves consistent, compassionate care.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/58">
                Carelink was built because understaffing in aged care is a real, daily problem — and it has real consequences for residents, families, and the dedicated carers who show up every day.
              </p>
              <p className="mt-4 text-base leading-7 text-white/45">
                We bring care homes and verified carers together, quickly and reliably. No guesswork. No gaps in coverage. Just trusted people, ready to help.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: 'Verified before day one', body: 'Every carer on Carelink has their qualifications, registrations, and police check confirmed before they can accept a shift.' },
                { icon: Users, title: 'People at the centre', body: 'We treat carers and care homes as partners, not just users. Fair pay, clear communication, and respect — always.' },
                { icon: Activity, title: 'Always accountable', body: 'From the moment a shift is posted to when it\'s completed, every step is visible and trackable.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
                  <Icon className="h-6 w-6 text-teal" />
                  <h3 className="mt-5 text-lg font-black text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/50">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Facilities */}
      <section id="facilities" className="bg-surface-1 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="For care homes"
            title="Staff your roster with confidence."
            body="Whether it&apos;s a planned shift or an urgent gap, Carelink finds you a verified carer who&apos;s ready to work — so you can focus on your residents, not your roster."
          />
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-surface-3 bg-surface-0 p-6 shadow-card sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-teal">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-tight text-ink">We take the stress out of staffing.</h3>
            <p className="mt-4 leading-7 text-ink/58">
              Post a shift, and we do the rest. Carelink matches you with qualified carers who are available, verified, and ready — so you never have to scramble.
            </p>
            <div className="mt-7 space-y-4">
              {facilityBenefits.map(step => (
                <div key={step} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" />
                  <span className="text-sm font-bold text-ink/72">{step}</span>
                </div>
              ))}
            </div>
            <Link
              href="/for-care-homes"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal hover:text-ink"
            >
              Explore for care homes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: Clock, label: 'Faster response', value: 'Shifts filled in minutes', tone: 'bg-amber-50 text-teal' },
              { icon: ShieldCheck, label: 'Peace of mind', value: 'Only verified carers', tone: 'bg-teal/10 text-teal' },
              { icon: ClipboardCheck, label: 'Stay compliant', value: 'Checks current, always', tone: 'bg-emerald-50 text-emerald-600' },
              { icon: Users, label: 'Full visibility', value: 'See who\'s on shift, live', tone: 'bg-sky-50 text-sky-600' },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-[24px] border border-surface-3 bg-surface-0 p-6 shadow-card">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.14em] text-ink/36">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance callout — the thing care homes worry about most */}
        <div className="mx-auto mt-10 max-w-6xl">
          <div className="grid items-center gap-6 rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <FileCheck2 className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-xl font-black tracking-tight text-ink sm:text-2xl">
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

      {/* For Workers */}
      <section id="workers" className="bg-surface-1 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">For carers</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Your skills deserve fair pay and real opportunities.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink/58">
              Whether you&apos;re a Registered Nurse, Enrolled Nurse, or Personal Care Assistant, Carelink puts shifts in front of you that match your qualifications — with award wages paid, always.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {workerBenefits.map(item => (
                <div key={item} className="flex gap-3">
                  <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                  <span className="text-sm font-bold leading-6 text-ink/70">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/for-carers"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-teal px-5 py-3 text-sm font-black text-ink shadow-btn transition-all hover:-translate-y-0.5 hover:bg-mint"
            >
              Explore for carers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[32px] border border-surface-3 bg-surface-2 p-4 shadow-card sm:p-5">
            <div className="rounded-[24px] bg-surface-0 p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-surface-3 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/35">Open shift</p>
                  <h3 className="mt-1 text-xl font-black text-ink">Morning RN shift</h3>
                </div>
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">Eligible</span>
              </div>

              <div className="py-5 space-y-3">
                <div className="flex items-center gap-3 text-sm text-ink/60">
                  <Clock className="w-4 h-4 text-ink/30 shrink-0" />
                  <span className="font-medium">Wednesday · 07:00 – 15:00 (8h)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink/60">
                  <Building2 className="w-4 h-4 text-ink/30 shrink-0" />
                  <span className="font-medium">Sunrise Aged Care, Melbourne</span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Pay guarantee</p>
                  <p className="font-bold text-emerald-800 mt-0.5">Award wages paid for this shift</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-surface-3 bg-surface-1 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-ink/65">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  Credentials verified
                </span>
                <span className="text-sm font-black text-teal">Accept shift →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-1 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-gradient-to-br from-ink via-[#241a12] to-[#33240f] px-6 py-12 text-center text-white shadow-modal sm:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Join Carelink today</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Better staffing. Better care. Every single shift.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
            Whether you run a care home or work as a carer, Carelink is built to make aged care staffing work the way it should — reliably, fairly, and with people at the centre.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal px-7 py-4 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:bg-mint sm:w-auto"
            >
              Try live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/for-care-homes"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-7 py-4 text-base font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 sm:w-auto"
            >
              For Care Homes
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
