import Link from 'next/link'
import {
  Activity, CheckCircle2, ArrowRight, Building2,
  Shield, Clock, Star, FileText, Users, BarChart3, Zap,
} from 'lucide-react'

export const metadata = {
  title: 'Carelink for Facilities — Aged Care Staffing, Compliance-Ready',
  description: 'Fill nursing shifts in under 30 minutes. Every worker AHPRA-registered, police-checked, and Aged Care Act 2024 compliant.',
}

export default function FacilityLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0d1b2a] overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e8ecf0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-black text-[17px] tracking-tight text-[#0d1b2a] no-underline">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-worker flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            Carelink
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[14px] font-medium text-[#6b7a8d] hover:text-[#0d1b2a] transition-colors">
              For Workers
            </Link>
            <Link href="/login" className="border border-[#e2e8f0] text-[#0d1b2a] px-4 py-2 rounded-[10px] text-[14px] font-semibold hover:border-[#0d1b2a] transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="bg-teal text-[#0d1b2a] px-5 py-2.5 rounded-[10px] text-[14px] font-extrabold hover:bg-teal/90 transition-colors">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white py-28 px-6"
        style={{ background: 'linear-gradient(160deg, #0d1b2a 0%, #1a3a5c 50%, #0d2b5e 100%)' }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,201,167,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/25 text-teal text-[12px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-7">
            <Zap className="w-3.5 h-3.5" /> Victoria's aged care staffing platform
          </div>

          <h1 className="text-4xl md:text-[64px] font-black leading-[1.02] tracking-[-3px] mb-6">
            Fill any shift.<br />
            <em className="not-italic text-teal">Meet care minutes.</em>
          </h1>

          <p className="text-[20px] text-white/55 leading-[1.65] max-w-[580px] mx-auto mb-10">
            Post once, reach every available compliant worker in your area. No phone calls. No agency markups. Full audit documentation built in.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 bg-teal text-[#0d1b2a] px-9 py-4.5 rounded-[14px] font-extrabold text-[16px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: '0 0 40px rgba(0,201,167,0.3)' }}
            >
              <Building2 className="w-5 h-5" />
              Post a Shift — Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white px-9 py-4.5 rounded-[14px] font-bold text-[16px] hover:bg-white/12 transition-colors"
            >
              See how it works
            </Link>
          </div>

          {/* Metrics strip */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 rounded-[20px] overflow-hidden max-w-[860px] mx-auto"
            style={{ background: 'rgba(255,255,255,0.08)', gap: '1px' }}
          >
            {[
              { num: '27m', label: 'Average fill time' },
              { num: '100%', label: 'AHPRA verified' },
              { num: '4.9★', label: 'Worker avg rating' },
              { num: '0', label: 'Agency markups' },
            ].map(m => (
              <div key={m.label} className="py-6 px-4 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-[40px] font-black text-teal tracking-[-2px] leading-none">{m.num}</div>
                <div className="text-[12px] text-white/40 mt-1.5 uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value cards ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-6">

        {/* For Facilities — dark featured */}
        <div
          className="rounded-3xl p-10"
          style={{ background: 'linear-gradient(145deg, #0d1b2a, #1a3a5c)', color: '#fff' }}
        >
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl mb-5" style={{ background: 'rgba(0,201,167,0.15)' }}>🏥</div>
          <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-teal mb-2.5">For Facilities</div>
          <h2 className="text-[28px] font-black tracking-tight mb-4 leading-[1.15]">Fill any shift.<br />Meet care minutes.</h2>
          <p className="text-[15px] text-white/55 leading-[1.7] mb-8">
            Post once, reach every available compliant worker in your area. No phone calls. No agency markups. Full audit documentation built in.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              'Post in 90 seconds',
              'See worker compliance history upfront',
              'Live roster and clock-in tracking',
              'Aged Care Act 2024 compliant records',
            ].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-[14px] text-white/65">
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-teal hover:text-teal/80 transition-colors">
            Register your facility <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* How we're different */}
        <div className="rounded-3xl p-10 bg-white border border-[#e8ecf0]">
          <div className="w-12 h-12 rounded-[14px] bg-[#ebfbf8] flex items-center justify-center text-2xl mb-5">✦</div>
          <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#0077b6] mb-2.5">How We're Different</div>
          <h2 className="text-[28px] font-black tracking-tight mb-4 leading-[1.15] text-[#0d1b2a]">Not an agency.<br />Not a job board.</h2>
          <p className="text-[15px] text-[#6b7a8d] leading-[1.7] mb-8">
            Traditional staffing agencies mark up labour costs and have no skin in your compliance. Job boards send you candidates you still have to vet. Carelink is a two-sided marketplace where compliance is automated and workers are pre-verified.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              'Workers vetted before their first shift',
              'Compliance docs stored and auto-expiry tracked',
              'No per-placement fee — transparent pricing',
              'You rate workers; workers rate facilities',
            ].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#4a5568]">
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="#contact" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#0077b6] hover:text-[#005a8a] transition-colors">
            Talk to our team <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Compliance section ───────────────────────────────────────────── */}
      <section className="bg-[#f8f9fb] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-teal text-[12px] font-bold uppercase tracking-[2px] mb-3">
              <Shield className="w-4 h-4" /> Compliance built in
            </div>
            <h2 className="text-3xl md:text-[42px] font-black tracking-[-1.5px] text-[#0d1b2a]">
              Aged Care Act 2024 ready.<br />From day one.
            </h2>
            <p className="text-[17px] text-[#6b7a8d] mt-4 max-w-2xl mx-auto">
              The 2024 Act introduced mandatory care minute targets, stronger worker screening obligations, and new audit requirements. Carelink is built around all of it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <Shield className="w-6 h-6 text-teal" />,
                title: 'Worker screening',
                items: [
                  'AHPRA registration verified & monitored',
                  'Current National Police Check',
                  'COVID & flu vaccination records',
                  'NDIS Worker Screening (where required)',
                ],
              },
              {
                icon: <FileText className="w-6 h-6 text-teal" />,
                title: 'Audit-ready records',
                items: [
                  'Every shift timestamped and logged',
                  'Clock-in/out records with GPS',
                  'Downloadable compliance reports',
                  'Document expiry alerts automated',
                ],
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-teal" />,
                title: 'Care minute tracking',
                items: [
                  'RN, EN, PCA hours tracked separately',
                  'Real-time progress toward monthly targets',
                  'Shift gap alerts before you fall short',
                  'Export-ready for ACQSC reporting',
                ],
              },
            ].map(col => (
              <div key={col.title} className="bg-white rounded-2xl p-7 border border-[#edf2f7]">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center mb-4">
                  {col.icon}
                </div>
                <h3 className="text-[18px] font-black tracking-tight mb-4 text-[#0d1b2a]">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-[#4a5568]">
                      <CheckCircle2 className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[12px] font-bold uppercase tracking-[2px] text-teal mb-3">For facility managers</div>
            <h2 className="text-3xl md:text-[42px] font-black tracking-[-1.5px] text-[#0d1b2a]">
              From gap to filled.<br />In under 30 minutes.
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: <Building2 className="w-6 h-6" />, title: 'Register your facility', body: 'Takes 10 minutes. Set your typical shift times, roles required, and your facility address.' },
              { step: '2', icon: <FileText className="w-6 h-6" />, title: 'Post a shift', body: 'Date, start/end time, role needed. That\'s it. 90 seconds. We handle matching automatically.' },
              { step: '3', icon: <Users className="w-6 h-6" />, title: 'Review & confirm', body: 'You see the worker\'s profile, compliance status, and ratings from other facilities before confirming.' },
              { step: '4', icon: <Clock className="w-6 h-6" />, title: 'They show up', body: 'Worker clocks in from their phone. You get a notification. All records auto-saved for compliance.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px bg-[#e8ecf0] z-0" style={{ width: 'calc(100% - 48px)', left: '48px' }} />
                )}
                <div className="relative z-10 w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mb-5">
                  {s.icon}
                </div>
                <div className="text-[12px] font-bold text-[#bbb] mb-1.5">Step {s.step}</div>
                <h3 className="text-[17px] font-black tracking-tight mb-2 text-[#0d1b2a]">{s.title}</h3>
                <p className="text-[14px] text-[#6b7a8d] leading-[1.65]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="text-[12px] font-bold uppercase tracking-[2px] text-teal mb-3">Social proof</div>
            <h2 className="text-3xl md:text-[42px] font-black tracking-[-1.5px] text-[#0d1b2a]">
              Facilities and workers<br />love Carelink.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                stars: '★★★★★',
                quote: '"We used to spend 3 hours on the phone every time a nurse called in sick. Now I post the shift, go back to bed, and it\'s filled by morning."',
                initials: 'SM', name: 'Sandra M.', role: 'DON, Sunrise Aged Care',
                bg: 'bg-gradient-to-br from-purple-500 to-purple-700',
              },
              {
                stars: '★★★★★',
                quote: '"Every worker we get through Carelink has their documents in order. That alone has saved us hours in compliance admin every month."',
                initials: 'RK', name: 'Robert K.', role: 'Facility Manager, Oakwood NH',
                bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
              },
              {
                stars: '★★★★★',
                quote: '"The care minute tracking dashboard is brilliant. We can see at a glance if we\'re on track — no more spreadsheets."',
                initials: 'TL', name: 'Theresa L.', role: 'Operations Manager, BrightCare',
                bg: 'bg-gradient-to-br from-sky-500 to-blue-700',
              },
            ].map(t => (
              <div key={t.name} className="bg-[#f8f9fb] rounded-2xl p-7 border border-[#edf2f7]">
                <div className="text-[#f6c90e] text-[13px] tracking-[2px] mb-3">{t.stars}</div>
                <p className="text-[15px] text-[#2d3748] leading-[1.65] mb-5">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[10px] ${t.bg} flex items-center justify-center font-extrabold text-[14px] text-white shrink-0`}>{t.initials}</div>
                  <div>
                    <div className="font-bold text-[14px] text-[#1a202c]">{t.name}</div>
                    <div className="text-[12px] text-[#a0aec0]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Us ──────────────────────────────────────────────────── */}
      <section id="contact" className="bg-[#f8f9fb] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-[12px] font-bold uppercase tracking-[2px] text-teal mb-3">Contact</div>
          <h2 className="text-3xl md:text-[44px] font-black tracking-[-2px] text-[#0d1b2a] mb-4">
            Want to see it in action?
          </h2>
          <p className="text-[17px] text-[#6b7a8d] leading-[1.7] mb-12 max-w-xl mx-auto">
            We'll walk you through the platform, show you how compliance tracking works, and help you post your first shift — no commitment required.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { icon: '📧', title: 'Email us', body: 'facilities@carelink.app', sub: 'Response within 4 business hours' },
              { icon: '📞', title: 'Request a demo', body: 'Book a 20-min walkthrough', sub: 'We come to you — no travel needed' },
              { icon: '🛡', title: 'Compliance queries', body: 'compliance@carelink.app', sub: 'Aged Care Act · AHPRA · ACQSC' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl px-6 py-7 text-center border border-[#edf2f7]">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="text-[12px] font-extrabold uppercase tracking-[1.5px] text-[#bbb] mb-1.5">{item.title}</div>
                <div className="text-[15px] font-bold text-[#0d1b2a]">{item.body}</div>
                <div className="text-[12px] text-[#aaa] mt-1">{item.sub}</div>
              </div>
            ))}
          </div>

          <a
            href="mailto:facilities@carelink.app"
            className="inline-flex items-center gap-2.5 bg-teal text-[#0d1b2a] px-9 py-4 rounded-xl font-extrabold text-[16px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: '0 0 30px rgba(0,201,167,0.25)' }}
          >
            Get in touch →
          </a>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #0d1b2a, #0d2b5e)' }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-[52px] font-black tracking-[-2px] mb-4">
            Your residents deserve<br />the best. So do you.
          </h2>
          <p className="text-[18px] text-white/50 mb-10">
            Join Victoria's fastest-growing aged care staffing network.<br />
            Start filling shifts in under 30 minutes.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 bg-teal text-[#0d1b2a] px-10 py-5 rounded-[14px] font-extrabold text-[18px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: '0 0 40px rgba(0,201,167,0.3)' }}
          >
            ✦ Get Started Free
          </Link>
          <p className="text-[13px] text-white/30 mt-4">No contracts. No setup fees. Free for 30 days.</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#0d1b2a] border-t border-white/[0.05] px-6 py-7 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-white/30">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal" />
          <span className="font-bold text-white/50">Carelink</span>
          <span>— Aged care staffing, done right.</span>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span>Victoria, Australia</span>
          <span>·</span>
          <span>Aged Care Act 2024 compliant</span>
          <span>·</span>
          <Link href="/" className="hover:text-white/50 transition-colors">For Workers</Link>
        </div>
      </footer>

    </div>
  )
}
