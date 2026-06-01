import Link from 'next/link'
import {
  Activity, ShieldCheck, Clock, Star, Users,
  CheckCircle2, ArrowRight, Building2, Stethoscope, Zap,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-white">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-ink/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-electric flex items-center justify-center shadow-btn">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">Carelink</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/workers"
              className="hidden sm:inline-flex text-sm font-semibold text-white/60 hover:text-white transition-colors px-3 py-2"
            >
              Workers
            </Link>
            <Link
              href="/for-facilities"
              className="hidden sm:inline-flex text-sm font-semibold text-white/60 hover:text-white transition-colors px-3 py-2"
            >
              Facilities
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-white/60 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/for-facilities"
              className="text-sm font-bold bg-teal text-ink px-4 py-2 rounded-xl hover:bg-teal/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Aged Care Act 2024 Compliant
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Fill nursing shifts<br />
            <span className="text-teal">in hours, not days</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            Connect your aged care facility with AHPRA-registered nurses, enrolled nurses,
            and PCAs across Victoria. On-demand staffing that helps you meet your mandatory
            care minute requirements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/for-facilities"
              className="flex items-center gap-2.5 bg-teal text-ink font-bold px-8 py-4 rounded-2xl text-base hover:bg-teal/90 transition-all hover:-translate-y-0.5 shadow-glow"
            >
              <Building2 className="w-5 h-5" />
              Register your facility
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/workers"
              className="flex items-center gap-2.5 bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-white/15 transition-all hover:-translate-y-0.5"
            >
              <Stethoscope className="w-5 h-5" />
              Find shifts
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust signals ───────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, label: 'AHPRA-registered workers', color: 'text-teal' },
            { icon: CheckCircle2, label: 'Police checks verified',   color: 'text-emerald-400' },
            { icon: Clock,        label: '24/7 shift availability',  color: 'text-sky-400' },
            { icon: Star,         label: 'Care minutes compliance',  color: 'text-amber-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className={`w-5 h-5 shrink-0 ${color}`} />
              <span className="text-white/70 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two-sided value props ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-8">

        {/* For Facilities */}
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 space-y-6 hover:border-teal/30 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-3">For Facilities</h2>
            <p className="text-white/55 leading-relaxed">
              Stop scrambling for last-minute coverage. Post a shift and get matched with
              a compliant, AHPRA-registered worker — often within the hour.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              'Post shifts in under 2 minutes',
              'View live roster and clock-in status',
              'Full spend tracking and invoicing',
              'Only matched with verified, compliant workers',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/for-facilities"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal hover:text-teal/80 transition-colors"
          >
            Register your facility <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* For Healthcare Workers */}
        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 space-y-6 hover:border-teal/30 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-teal/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 text-teal" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-3">For Healthcare Workers</h2>
            <p className="text-white/55 leading-relaxed">
              Browse available shifts at aged care facilities across Victoria. Accept what
              fits your schedule, clock in on your phone, and get paid fast.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              'Browse shifts by role (RN, EN, PCA)',
              'Accept shifts instantly — no phone calls',
              'Clock in/out from your mobile',
              'Track your pay and shift history',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/workers"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal hover:text-teal/80 transition-colors"
          >
            Find shifts near you <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-white/8 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Ready to modernise your<br />aged care staffing?
          </h2>
          <p className="text-white/50 text-lg">
            Join facilities and healthcare workers already on Carelink.
            No lock-in contracts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/for-facilities"
              className="flex items-center gap-2.5 bg-teal text-ink font-bold px-8 py-4 rounded-2xl text-base hover:bg-teal/90 transition-all hover:-translate-y-0.5 shadow-glow"
            >
              Need staff <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/workers"
              className="flex items-center gap-2.5 bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-white/15 transition-all hover:-translate-y-0.5"
            >
              Want shifts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal" />
            <span className="font-bold text-white/50">Carelink</span>
            <span>— Aged care staffing marketplace</span>
          </div>
          <p>Compliant with the Aged Care Act 2024 · Victoria, Australia</p>
        </div>
      </footer>
    </div>
  )
}
