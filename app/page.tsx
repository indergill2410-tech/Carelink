import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  DollarSign,
  ShieldCheck,
  Star,
  Stethoscope,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Carelink Aged Care Staffing OS',
  description:
    'A premium aged-care staffing operating system for compliant shift coverage, award-floor pay visibility, worker trust, and facility control.',
}

const navLinks = [
  { href: '#facilities', label: 'Facilities' },
  { href: '#workers', label: 'Workers' },
  { href: '#compliance', label: 'Compliance' },
  { href: '#pay', label: 'Pay engine' },
]

const trustSignals = [
  { icon: ShieldCheck, label: 'Document checked', detail: 'AHPRA, police and expiry visibility' },
  { icon: DollarSign, label: 'Award-floor guardrails', detail: 'Role-based pay floors built into shift offers' },
  { icon: Zap, label: 'ERTC visibility', detail: 'Incentive estimates shown before a shift is accepted' },
  { icon: Clock, label: 'Live coverage control', detail: 'Open, matched and clocked status in one view' },
]

const facilitySteps = [
  'Post a compliant shift request',
  'See matched worker readiness',
  'Track clock-in and care coverage',
  'Approve timesheets with pay clarity',
]

const workerPromises = [
  'Know the estimated total before accepting',
  'See loadings and incentive value clearly',
  'Keep documents and expiry status visible',
  'Move from open shift to completed pay history',
]

const coverageRows = [
  { role: 'RN', facility: 'Sunrise Aged Care', time: '07:00-15:00', status: 'Matched', accent: 'bg-sky-400' },
  { role: 'EN', facility: 'Oakwood Nursing Home', time: '15:00-23:00', status: 'Open', accent: 'bg-violet-400' },
  { role: 'PCA', facility: 'Bayside Care', time: '23:00-07:00', status: 'Clocked in', accent: 'bg-teal' },
]

const payRows = [
  { label: 'NURSE', floor: '$55.00/hr', note: 'Floor protected' },
  { label: 'EN', floor: '$45.00/hr', note: 'Loadings visible' },
  { label: 'PCA', floor: '$32.50/hr', note: 'ERTC estimated' },
]

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Carelink home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-electric shadow-btn">
        <Activity className="h-5 w-5 text-white" />
      </span>
      <span className="text-base font-black tracking-tight text-white">Carelink</span>
    </Link>
  )
}

function HeroConsole() {
  return (
    <div
      className="mx-auto mt-12 w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.08] shadow-[0_42px_110px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
      aria-label="Carelink live operations preview"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-teal" />
        </div>
        <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/55 sm:block">
          Live staffing command
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal/80">Coverage risk</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">3 shifts need action</h2>
            </div>
            <div className="rounded-2xl border border-teal/25 bg-teal/10 px-4 py-3 text-right">
              <p className="text-2xl font-black text-white">98%</p>
              <p className="text-xs font-semibold text-teal/80">ready pool</p>
            </div>
          </div>

          <div className="space-y-3">
            {coverageRows.map(row => (
              <div key={`${row.role}-${row.facility}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <div className={`h-10 w-10 rounded-xl ${row.accent} flex items-center justify-center text-sm font-black text-ink`}>
                  {row.role}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{row.facility}</p>
                  <p className="text-xs font-medium text-white/45">{row.time}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-bold text-white/70">
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Spend</p>
              <p className="mt-2 text-2xl font-black text-white">$18.4k</p>
              <p className="text-xs font-semibold text-teal/80">forecast this week</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Compliance</p>
              <p className="mt-2 text-2xl font-black text-white">Green</p>
              <p className="text-xs font-semibold text-teal/80">docs current</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black text-white">Pay engine</p>
              <span className="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-black text-ink">ERTC on</span>
            </div>
            <div className="space-y-3">
              {payRows.map(row => (
                <div key={row.label} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 text-sm">
                  <span className="font-black text-white">{row.label}</span>
                  <span className="h-2 rounded-full bg-white/10">
                    <span className="block h-full w-3/4 rounded-full bg-gradient-electric" />
                  </span>
                  <span className="text-right">
                    <span className="block font-black text-white">{row.floor}</span>
                    <span className="text-xs font-semibold text-white/40">{row.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-ink/58 sm:text-lg">{body}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-surface-1 text-ink">
      <section className="relative bg-ink text-white">
        <div className="absolute inset-0 bg-mesh opacity-90" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/8 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <nav className="relative z-20 border-b border-white/10 bg-ink/60 backdrop-blur-2xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <BrandMark />
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-white/58 transition-colors hover:bg-white/8 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-bold text-white/62 transition-colors hover:bg-white/8 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-ink shadow-btn transition-all hover:-translate-y-0.5 hover:bg-teal"
              >
                Try demo
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal">
            <ShieldCheck className="h-3.5 w-3.5" />
            Australian aged-care staffing, built for trust
          </div>

          <h1 className="mx-auto mt-7 max-w-5xl text-5xl font-black leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Carelink Aged Care Staffing OS
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-white/64 sm:text-xl">
            A calm, premium operations layer for aged-care providers: fill shifts faster, show workers fair pay visibility, and keep compliance decisions clear before risk reaches the floor.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/for-facilities"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal px-7 text-base font-black text-ink shadow-glow transition-all hover:-translate-y-0.5 hover:bg-mint sm:w-auto"
            >
              Start facility coverage
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/workers"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-7 text-base font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 sm:w-auto"
            >
              Explore worker shifts
              <Stethoscope className="h-4 w-4" />
            </Link>
          </div>

          <HeroConsole />
        </div>
      </section>

      <section className="border-b border-surface-3 bg-white">
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

      <section id="facilities" className="bg-surface-1 px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="For aged-care providers"
          title="Shift coverage that feels controlled, not chaotic."
          body="Carelink gives facility managers the emotional signal they need most: this is under control. Every request, match, worker status and estimated spend is presented before it becomes a late-night escalation."
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-surface-3 bg-white p-6 shadow-card sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-2xl font-black tracking-tight text-ink">Facilities get operational confidence.</h3>
            <p className="mt-4 leading-7 text-ink/58">
              The page should reassure executives and care managers at the same time: premium enough for leadership, practical enough for the person posting tonight&apos;s shift.
            </p>
            <div className="mt-7 space-y-4">
              {facilitySteps.map(step => (
                <div key={step} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" />
                  <span className="text-sm font-bold text-ink/72">{step}</span>
                </div>
              ))}
            </div>
            <Link
              href="/for-facilities"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal hover:text-ink"
            >
              Register a facility
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: Clock, label: 'Faster shift response', value: 'Minutes, not days', tone: 'bg-amber-50 text-amber-600' },
              { icon: ShieldCheck, label: 'Compliance confidence', value: 'Docs before dispatch', tone: 'bg-teal/10 text-teal' },
              { icon: Star, label: 'Care-minute support', value: 'Coverage visibility', tone: 'bg-violet-50 text-violet-600' },
              { icon: DollarSign, label: 'Spend clarity', value: 'Pay quote per shift', tone: 'bg-sky-50 text-sky-600' },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-[24px] border border-surface-3 bg-white p-6 shadow-card">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.14em] text-ink/36">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workers" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">For workers</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Workers should feel respected before they tap accept.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink/58">
              A beautiful landing page is not just polish. It tells nurses, ENs and PCAs that Carelink treats their work seriously: clear rates, visible loadings, document status and fewer phone-call loops.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {workerPromises.map(item => (
                <div key={item} className="flex gap-3">
                  <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                  <span className="text-sm font-bold leading-6 text-ink/70">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/workers"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-teal px-5 py-3 text-sm font-black text-ink shadow-btn transition-all hover:-translate-y-0.5 hover:bg-mint"
            >
              See worker pathway
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[32px] border border-surface-3 bg-surface-1 p-4 shadow-card sm:p-5">
            <div className="rounded-[24px] bg-white p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-surface-3 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/35">Worker offer</p>
                  <h3 className="mt-1 text-xl font-black text-ink">RN night shift</h3>
                </div>
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">Eligible</span>
              </div>

              <div className="grid grid-cols-3 gap-3 py-5">
                <div>
                  <p className="text-xs font-bold text-ink/40">Base</p>
                  <p className="mt-1 text-lg font-black text-ink">$55/hr</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink/40">Loadings</p>
                  <p className="mt-1 text-lg font-black text-ink">$66</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink/40">ERTC</p>
                  <p className="mt-1 text-lg font-black text-ink">$75</p>
                </div>
              </div>

              <div className="rounded-2xl bg-ink p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Estimated total</p>
                <p className="mt-2 text-4xl font-black">$581.00</p>
                <p className="mt-2 text-sm font-medium leading-6 text-white/55">
                  Includes role floor, night loading and incentive estimate before the worker commits.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-surface-3 bg-surface-1 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-ink/65">
                  <ClipboardCheck className="h-4 w-4 text-teal" />
                  Compliance ready
                </span>
                <span className="text-sm font-black text-teal">Accept shift</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="compliance" className="bg-ink px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Trust and safety</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                The psychological job: reduce fear.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/58">
                Aged-care buyers are not buying software first. They are buying relief from understaffing risk, compliance doubt, family complaints and operational noise. The landing page should feel calm, exact and accountable.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: 'Verified readiness', body: 'AHPRA and required document status sit close to every dispatch decision.' },
                { icon: Users, title: 'Human trust', body: 'Workers see transparent value and facilities see clear matching context.' },
                { icon: Activity, title: 'Live state', body: 'Open, matched, clocked and completed work feels visible at all times.' },
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

      <section id="pay" className="bg-surface-1 px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Business model logic"
          title="A pay story that protects both sides."
          body="The homepage should make the business feel commercially serious: facilities see spend control, workers see fair value, and the platform shows its compliance discipline without sounding bureaucratic."
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
          {[
            { title: 'Award wage floor', body: 'Every shift offer starts from a role-aware floor, so low-quality pricing does not become the marketplace norm.' },
            { title: 'Loadings made visible', body: 'Weekend, night and urgent loadings become plain-language estimates instead of hidden back-office arithmetic.' },
            { title: 'ERTC incentive clarity', body: 'Incentives are shown as estimates with controlled caps, helping workers understand the upside before accepting.' },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-[28px] border border-surface-3 bg-white p-7 shadow-card">
              <DollarSign className="h-6 w-6 text-teal" />
              <h3 className="mt-5 text-xl font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/55">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-ink px-6 py-12 text-center text-white shadow-modal sm:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal">Ready for the next push</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Make Carelink feel like the safest way to run aged-care staffing.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
            The landing page should convert facilities, reassure workers and invite investors into a product that already behaves like a serious operations platform.
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
              href="/for-facilities"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-7 py-4 text-base font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 sm:w-auto"
            >
              Facility pathway
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-3 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-ink/45 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal" />
            <span className="font-black text-ink">Carelink</span>
            <span>Aged-care staffing operating system</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="font-bold hover:text-teal">Sign in</Link>
            <Link href="/workers" className="font-bold hover:text-teal">Workers</Link>
            <Link href="/for-facilities" className="font-bold hover:text-teal">Facilities</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
