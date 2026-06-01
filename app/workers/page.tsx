import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Activity, ArrowRight, CalendarCheck, CheckCircle2, Clock,
  FileCheck2, ShieldCheck, Stethoscope, Wallet,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Aged Care Shifts',
  description: 'Register as an RN, EN, or PCA worker to find flexible aged-care shifts with Carelink.',
  alternates: { canonical: '/workers' },
}

const steps = [
  { title: 'Create your profile', body: 'Choose RN, EN, or PCA so shift matching starts with the right role.' },
  { title: 'Upload compliance documents', body: 'Keep police checks, registrations, and certificates in one review queue.' },
  { title: 'Accept matching shifts', body: 'Browse available shifts, confirm the details, and manage your roster from mobile.' },
]

export default function WorkersPage() {
  return (
    <div className="min-h-screen bg-ink text-white">
      <nav className="border-b border-white/8 bg-ink/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-electric flex items-center justify-center shadow-btn">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">Carelink</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/for-facilities" className="hidden sm:inline-flex text-sm font-semibold text-white/55 hover:text-white px-3 py-2">
              For facilities
            </Link>
            <Link href="/login" className="text-sm font-bold bg-teal text-ink px-4 py-2 rounded-xl hover:bg-teal/90 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-60" />
          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5" /> For RN, EN, and PCA workers
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                Flexible aged-care shifts, without the phone chase.
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl mb-8">
                Build one Carelink profile, keep your documents ready, and accept shifts that match your role and availability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="inline-flex items-center justify-center gap-2.5 bg-teal text-ink font-bold px-7 py-4 rounded-2xl hover:bg-teal/90 transition-all hover:-translate-y-0.5 shadow-glow">
                  Start worker registration <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2.5 bg-white/10 border border-white/20 text-white font-bold px-7 py-4 rounded-2xl hover:bg-white/15 transition-all">
                  Try worker demo
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-modal">
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div>
                  <p className="text-label text-teal/80">Next shift</p>
                  <h2 className="text-2xl font-black mt-1">Morning care team</h2>
                </div>
                <span className="rounded-full bg-teal/10 text-teal border border-teal/20 px-3 py-1 text-xs font-bold">Matched role</span>
              </div>
              <div className="py-6 space-y-4">
                {[
                  { icon: CalendarCheck, label: 'Tue 9 Jun · 7:00 AM to 3:00 PM' },
                  { icon: ShieldCheck, label: 'Compliance status visible before accepting' },
                  { icon: Wallet, label: 'Estimated shift earnings shown upfront' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-white/70">
                    <Icon className="w-5 h-5 text-teal" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <button className="w-full rounded-2xl bg-teal text-ink font-black py-4">Accept shift</button>
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">
            {[
              { icon: FileCheck2, label: 'Document vault', body: 'Upload once and keep review status visible.' },
              { icon: Clock, label: 'Mobile shift flow', body: 'Accept, clock in, clock out, and review history.' },
              { icon: Wallet, label: 'Pay visibility', body: 'Track completed shifts and estimated earnings.' },
            ].map(({ icon: Icon, label, body }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Icon className="w-6 h-6 text-teal mb-4" />
                <h2 className="font-black mb-2">{label}</h2>
                <p className="text-sm text-white/55 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="w-10 h-10 rounded-2xl bg-teal/15 text-teal flex items-center justify-center font-black mb-5">
                  {index + 1}
                </div>
                <h2 className="text-xl font-black mb-3">{step.title}</h2>
                <p className="text-white/55 leading-relaxed text-sm">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-white/55">
            <CheckCircle2 className="w-5 h-5 text-teal" />
            Carelink will not treat broad marketing copy as award or pay advice. Final role/pay classification remains a production compliance task.
          </div>
        </section>
      </main>
    </div>
  )
}
