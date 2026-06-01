import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Activity, ArrowRight, BellRing, Building2, CalendarClock,
  CheckCircle2, FileText, ShieldCheck, Users,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aged Care Staffing For Facilities',
  description: 'Post aged-care shifts, view worker compliance, and manage facility coverage with Carelink.',
  alternates: { canonical: '/for-facilities' },
}

const outcomes = [
  'Post urgent RN, EN, and PCA shifts from one portal',
  'See worker role and compliance status before the shift starts',
  'Track filled, open, completed, and cancelled shifts',
  'Keep operational records ready for internal review',
]

export default function ForFacilitiesPage() {
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
            <Link href="/workers" className="hidden sm:inline-flex text-sm font-semibold text-white/55 hover:text-white px-3 py-2">
              For workers
            </Link>
            <Link href="/login" className="text-sm font-bold bg-teal text-ink px-4 py-2 rounded-xl hover:bg-teal/90 transition-colors">
              Register facility
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-60" />
          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-[1fr_0.95fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-400/10 border border-sky-400/20 text-sky-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" /> For Australian aged-care operators
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                Fill shifts faster, with compliance records attached.
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-xl mb-8">
                Carelink gives facility managers a cleaner way to request staff, monitor shift status, and keep worker documentation visible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="inline-flex items-center justify-center gap-2.5 bg-teal text-ink font-bold px-7 py-4 rounded-2xl hover:bg-teal/90 transition-all hover:-translate-y-0.5 shadow-glow">
                  Register your facility <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2.5 bg-white/10 border border-white/20 text-white font-bold px-7 py-4 rounded-2xl hover:bg-white/15 transition-all">
                  Try facility demo
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-modal">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-400/15 flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-sky-300" />
                </div>
                <div>
                  <p className="text-label text-white/40">Shift request</p>
                  <h2 className="text-xl font-black">Evening RN coverage</h2>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ['Status', 'Open'],
                  ['Role', 'Registered Nurse'],
                  ['Coverage', '3:00 PM to 11:00 PM'],
                  ['Compliance', 'Document checked before match'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                    <span className="text-sm text-white/45">{label}</span>
                    <span className="text-sm font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-4 gap-5">
            {[
              { icon: Users, label: 'Workforce pool' },
              { icon: ShieldCheck, label: 'Compliance visibility' },
              { icon: BellRing, label: 'Urgent shift flow' },
              { icon: FileText, label: 'Export-ready records' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                <Icon className="w-5 h-5 text-teal shrink-0" />
                <span className="text-sm font-semibold text-white/75">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-[0.9fr_1.1fr] gap-12">
          <div>
            <p className="text-label text-teal/80 mb-3">Operational wedge</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-5">
              Built for the manager who gets the 5 AM coverage call.
            </h2>
            <p className="text-white/55 leading-relaxed">
              The facility portal should become the place to request staff, see who accepted, confirm arrival, review completion, and retrieve the evidence trail later.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {outcomes.map(item => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <CheckCircle2 className="w-5 h-5 text-teal mb-4" />
                <p className="text-sm text-white/70 leading-relaxed font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
