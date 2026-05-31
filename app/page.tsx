import Link from 'next/link'
import { Activity, CheckCircle2, ArrowRight, Shield, Smartphone, Calendar } from 'lucide-react'

export default function WorkerLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0d0d14] overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#f0f0f4]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-black text-[17px] tracking-tight text-[#0d0d14] no-underline">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-worker flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            Carelink
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/for-facilities"
              className="bg-[#f4f4f6] text-[#555] px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-[#e8e8ec] transition-colors"
            >
              I manage a facility
            </Link>
            <Link
              href="/login"
              className="bg-[#0d0d14] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-bold hover:bg-[#1a1a2e] transition-colors"
            >
              Join as a worker →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0d14 0%, #0d2b4a 55%, #0a3d2e 100%)',
          minHeight: '90vh',
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Teal glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-100px', left: '30%',
            width: '700px', height: '500px',
            background: 'radial-gradient(ellipse, rgba(0,201,167,0.12) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-[11px] font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-7">
              <span className="w-1.5 h-1.5 bg-teal rounded-full" />
              For RNs, ENs &amp; PCAs across Victoria
            </div>

            <h1 className="text-5xl md:text-[66px] font-black leading-[1.0] tracking-[-3px] text-white mb-6">
              Your skills.<br />
              <span className="text-teal">Your schedule.</span><br />
              Your call.
            </h1>

            <p className="text-[19px] text-white/50 leading-[1.7] mb-10 max-w-[480px]">
              You trained for years to care for people — not to fight for shifts, beg for days off, or feel invisible.{' '}
              <strong className="text-white/85 font-semibold">Carelink gives you back control.</strong>
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-teal text-[#0d0d14] px-8 py-4 rounded-xl font-extrabold text-[16px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: '0 8px 32px rgba(0,201,167,0.28)' }}
              >
                Set up your profile — free
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-white/45 text-[14px] font-semibold hover:text-white/70 transition-colors"
              >
                See available shifts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-t border-white/[0.07] pt-7">
              {[
                '5 min to set up',
                'No lock-in contract',
                'Accept only what you want',
              ].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" />
                  <span className="text-[12px] text-white/40 font-semibold">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Profile card stack */}
          <div className="relative hidden md:block">

            {/* Ghost card behind */}
            <div
              className="rounded-[20px] p-6 border border-white/10 mb-3"
              style={{
                background: 'rgba(255,255,255,0.06)',
                opacity: 0.5,
                transform: 'translateY(-8px) scale(0.97)',
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-extrabold text-[15px] text-white shrink-0">MP</div>
                <div>
                  <div className="text-[15px] font-extrabold text-white">Marcus P.</div>
                  <div className="text-[12px] text-white/40 mt-0.5">Enrolled Nurse · 4 yrs</div>
                </div>
                <span className="ml-auto text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide bg-teal/15 border border-teal/25 text-teal">Active</span>
              </div>
            </div>

            {/* Featured card */}
            <div
              className="rounded-[20px] p-6 border mb-3"
              style={{
                background: 'rgba(255,255,255,0.09)',
                borderColor: 'rgba(0,201,167,0.25)',
                boxShadow: '0 0 40px rgba(0,201,167,0.08)',
              }}
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-worker flex items-center justify-center font-extrabold text-[15px] text-white shrink-0">JP</div>
                <div>
                  <div className="text-[15px] font-extrabold text-white">Jessica P., RN</div>
                  <div className="text-[12px] text-white/40 mt-0.5">Registered Nurse · 6 yrs</div>
                </div>
                <span className="ml-auto text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide bg-teal/15 border border-teal/25 text-teal">✓ Verified</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { val: '47', label: 'Shifts done', teal: true },
                  { val: '4.9★', label: 'Rating', teal: false },
                  { val: '100%', label: 'Compliant', teal: true },
                ].map(s => (
                  <div key={s.label} className="rounded-[10px] px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className={`text-[17px] font-black tracking-tight ${s.teal ? 'text-teal' : 'text-white'}`}>{s.val}</div>
                    <div className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['Available Tue', 'Available Thu', 'Melbourne CBD', 'Richmond'].map((t, i) => (
                  <span
                    key={t}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${i < 2 ? 'bg-teal/12 text-teal' : 'text-white/55'}`}
                    style={i >= 2 ? { background: 'rgba(255,255,255,0.06)' } : {}}
                  >{t}</span>
                ))}
              </div>
            </div>

            {/* Floating notification */}
            <div
              className="absolute -bottom-3 -right-5 bg-white rounded-2xl px-4 py-3 flex items-center gap-2.5 animate-float"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
            >
              <div className="w-8 h-8 bg-[#ebfbf8] rounded-[9px] flex items-center justify-center text-base shrink-0">🔔</div>
              <div>
                <div className="text-[13px] font-extrabold text-[#0d0d14]">New shift matched</div>
                <div className="text-[11px] text-[#888] mt-0.5">Sunrise Aged Care · Tomorrow 7am</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Identity: You didn't spend three years studying... ───────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-5 h-0.5 bg-teal" />
          <span className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal">Why Carelink</span>
        </div>
        <h2 className="text-4xl md:text-[52px] font-black tracking-[-2.5px] leading-[1.05] mb-16 max-w-[700px]">
          You didn't spend three years<br />
          studying to <span className="text-teal">feel disposable.</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-[2px]">
          {[
            {
              num: '01', icon: <Calendar className="w-7 h-7" />,
              title: 'You pick every shift',
              body: 'Browse what\'s available, accept what fits your life. Tuesday morning only? Night shifts only? That\'s entirely your choice. Nobody will call you at 6am.',
              highlight: false,
            },
            {
              num: '02', icon: <Shield className="w-7 h-7" />,
              title: 'Every facility is vetted',
              body: 'You know exactly where you\'re going before you arrive. No surprises. Every facility on Carelink is rated by other workers — the good ones and the ones to avoid.',
              highlight: true,
            },
            {
              num: '03', icon: <Smartphone className="w-7 h-7" />,
              title: 'Clock in. Go home. Done.',
              body: 'Clock in on your phone. Hours are logged automatically. No paperwork. No chasing anyone. Your record is yours — portable, professional, always up to date.',
              highlight: false,
            },
          ].map((card, i) => (
            <div
              key={card.num}
              className={`px-9 py-10 ${
                card.highlight
                  ? 'bg-[#0d0d14] text-white rounded-2xl shadow-2xl relative z-10'
                  : 'bg-[#f8f9fb] ' + (i === 0 ? 'rounded-l-2xl' : 'rounded-r-2xl')
              }`}
              style={card.highlight ? { transform: 'scale(1.02)' } : {}}
            >
              <div className="text-[11px] font-extrabold text-black/20 mb-5" style={card.highlight ? { color: 'rgba(255,255,255,0.2)' } : {}}>{card.num}</div>
              <div className={`mb-4 ${card.highlight ? 'text-teal' : 'text-[#0d0d14]'}`}>{card.icon}</div>
              <h3 className={`text-[20px] font-black tracking-tight mb-2.5 leading-[1.2] ${card.highlight ? 'text-teal' : 'text-[#0d0d14]'}`}>{card.title}</h3>
              <p className={`text-[14px] leading-[1.65] ${card.highlight ? 'text-white/55' : 'text-[#666]'}`}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="bg-[#0d0d14] text-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-[11px] font-extrabold uppercase tracking-[2px] text-white/30 mb-4">Getting started</div>
          <h2 className="text-4xl md:text-[48px] font-black tracking-[-2px] mb-16">
            From sign-up to <span className="text-teal">first shift</span><br />in 24 hours.
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div
              className="absolute top-6 hidden md:block"
              style={{
                left: '10%', right: '10%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(0,201,167,0.3), rgba(0,201,167,0.3), transparent)',
              }}
            />

            {[
              { icon: '📋', title: 'Create your profile', body: 'Your name, role, availability, and the areas you work in. Takes about 5 minutes.', time: '⏱ 5 minutes', bg: 'rgba(0,201,167,0.12)', border: 'rgba(0,201,167,0.2)' },
              { icon: '🛡', title: 'Upload your documents', body: 'AHPRA registration, police check, immunisations. Upload once — stored securely, stay current.', time: '⏱ Once only', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)' },
              { icon: '🔍', title: 'Browse open shifts', body: 'Filter by role, location, date. See the facility and what other workers have said about it.', time: '⏱ Daily', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
              { icon: '✓', title: 'Accept. Show up. Done.', body: 'One tap to accept. Clock in on arrival. Your reputation grows with every shift.', time: '⏱ Always this simple', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
            ].map(step => (
              <div key={step.title} className="relative z-10">
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl mb-6"
                  style={{ background: step.bg, border: `1px solid ${step.border}` }}
                >
                  {step.icon}
                </div>
                <h3 className="text-[17px] font-extrabold mb-2">{step.title}</h3>
                <p className="text-[13px] text-white/40 leading-[1.65] mb-3">{step.body}</p>
                <span className="text-[11px] font-bold text-teal">{step.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="bg-[#f8f9fb] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-0.5 bg-teal" />
            <span className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal">From our community</span>
          </div>
          <h2 className="text-4xl md:text-[44px] font-black tracking-[-2px] mb-12">
            Workers who chose<br />to work differently.
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Large featured */}
            <div className="md:col-span-2 bg-[#0d0d14] rounded-[20px] p-8 border border-transparent">
              <div className="text-[12px] tracking-[2px] text-amber-400 mb-4">★ ★ ★ ★ ★</div>
              <p className="text-[22px] text-white/85 leading-[1.7] mb-6 tracking-[-0.3px]">
                "I was burning out in my full-time role. I didn't realise how much of my stress came from having no control over my week. On Carelink I work three shifts a week, I choose every single one, and I actually look forward to going in. I'm a better nurse for it."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-worker flex items-center justify-center font-extrabold text-[14px] text-white shrink-0">SR</div>
                <div>
                  <div className="font-extrabold text-[14px] text-white">Sarah R.</div>
                  <div className="text-[12px] text-white/35 mt-0.5">Registered Nurse · 8 years experience</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 border border-[#edf0f5]">
              <div className="text-[12px] tracking-[2px] text-amber-400 mb-4">★ ★ ★ ★ ★</div>
              <p className="text-[16px] text-[#2d3748] leading-[1.7] mb-6">
                "I have two kids. The only way nursing works for my family is if I control my hours. Carelink is the first platform that actually respects that."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center font-extrabold text-[14px] text-white shrink-0">KT</div>
                <div>
                  <div className="font-extrabold text-[14px] text-[#0d0d14]">Karen T.</div>
                  <div className="text-[12px] text-[#aaa] mt-0.5">Enrolled Nurse · Geelong</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 border border-[#edf0f5]">
              <div className="text-[12px] tracking-[2px] text-amber-400 mb-4">★ ★ ★ ★ ★</div>
              <p className="text-[16px] text-[#2d3748] leading-[1.7] mb-6">
                "I set up my profile on a Sunday. Had my first shift booked by Monday morning. The whole thing — profile, documents, first shift — under 24 hours."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-extrabold text-[14px] text-white shrink-0">DM</div>
                <div>
                  <div className="font-extrabold text-[14px] text-[#0d0d14]">Daniel M.</div>
                  <div className="text-[12px] text-[#aaa] mt-0.5">PCA · Melbourne CBD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles strip ─────────────────────────────────────────────────── */}
      <section className="border-y border-[#f0f0f4]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#f0f0f4]">
          {[
            { label: 'For', name: 'Registered Nurses', desc: 'AHPRA-registered RNs.\nHospital or aged care background.' },
            { label: 'For', name: 'Enrolled Nurses', desc: 'Division 2 nurses.\nCertificate IV and above.' },
            { label: 'For', name: 'Personal Care Assistants', desc: 'Cert III or higher.\nAged care or disability experience.' },
          ].map(role => (
            <div key={role.name} className="px-8 py-9 text-center">
              <div className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-[#bbb] mb-2.5">{role.label}</div>
              <div className="text-[22px] font-black text-[#0d0d14] tracking-tight">{role.name}</div>
              <div className="text-[13px] text-[#aaa] mt-1.5 leading-[1.4] whitespace-pre-line">{role.desc}</div>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse-dot" />
                <span className="text-[12px] font-bold text-teal">Shifts available now</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact Us ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-5 h-0.5 bg-teal" />
            <span className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal">Get in touch</span>
            <span className="w-5 h-0.5 bg-teal" />
          </div>
          <h2 className="text-3xl md:text-[44px] font-black tracking-[-2px] mb-4">Questions? We're here.</h2>
          <p className="text-[17px] text-[#666] leading-[1.7] mb-10 max-w-xl mx-auto">
            Whether you're a healthcare worker exploring your options or a facility wanting to find out more — reach out and we'll come back to you within a business day.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { icon: '📧', title: 'Email us', body: 'hello@carelink.app', sub: 'We reply within 24 hours' },
              { icon: '📍', title: 'Based in', body: 'Victoria, Australia', sub: 'Serving aged care facilities statewide' },
              { icon: '🛡', title: 'Compliance', body: 'Aged Care Act 2024', sub: 'AHPRA · Police check · Privacy Act' },
            ].map(item => (
              <div key={item.title} className="bg-[#f8f9fb] rounded-2xl px-6 py-7 text-center border border-[#edf0f5]">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="text-[12px] font-extrabold uppercase tracking-[1.5px] text-[#bbb] mb-1.5">{item.title}</div>
                <div className="text-[16px] font-bold text-[#0d0d14]">{item.body}</div>
                <div className="text-[12px] text-[#aaa] mt-1">{item.sub}</div>
              </div>
            ))}
          </div>

          <a
            href="mailto:hello@carelink.app"
            className="inline-flex items-center gap-2 bg-[#0d0d14] text-white px-8 py-4 rounded-xl font-bold text-[15px] hover:bg-[#1a1a2e] transition-colors"
          >
            Send us a message →
          </a>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-32 px-6 text-center"
        style={{ background: 'linear-gradient(160deg, #0d0d14, #0a2e22 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,201,167,0.12) 0%, transparent 65%)',
          }}
        />
        <div className="relative z-10 max-w-[680px] mx-auto">
          <div className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal/60 mb-5">Ready to work differently?</div>
          <h2 className="text-5xl md:text-[60px] font-black tracking-[-3px] leading-[1.0] text-white mb-5">
            Your next shift.<br />
            <span className="text-teal">On your terms.</span>
          </h2>
          <p className="text-[18px] text-white/45 leading-[1.65] mb-12">
            Join the growing community of Victorian healthcare workers who decided their skills — and their time — deserve more respect.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/login"
              className="bg-teal text-[#0d0d14] px-10 py-5 rounded-xl font-black text-[17px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: '0 8px 32px rgba(0,201,167,0.3)' }}
            >
              Create your free profile →
            </Link>
            <Link
              href="/login"
              className="text-white/65 border border-white/12 px-8 py-5 rounded-xl font-bold text-[17px] hover:bg-white/7 transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              Browse open shifts
            </Link>
          </div>
          <p className="text-[12px] text-white/25 mt-5">Free to join. No lock-in. Accept only shifts you want.</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="border-t px-6 py-7 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px]"
        style={{ background: '#0d0d14', borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
      >
        <div className="flex items-center gap-2 font-extrabold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <div className="w-6 h-6 rounded-[7px] bg-gradient-worker flex items-center justify-center shrink-0">
            <Activity className="w-3 h-3 text-white" />
          </div>
          Carelink
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <span>Victoria, Australia</span>
          <span>·</span>
          <span>AHPRA-verified workforce</span>
          <span>·</span>
          <span>Aged Care Act 2024 compliant</span>
          <span>·</span>
          <Link href="/for-facilities" className="hover:text-white/50 transition-colors">For Facilities</Link>
        </div>
      </footer>

    </div>
  )
}
