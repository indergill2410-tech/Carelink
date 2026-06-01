import Link from 'next/link'
import { Activity, CheckCircle2, ArrowRight, Shield, Smartphone, Calendar, Upload, UserCheck, Zap } from 'lucide-react'

export default function WorkerLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0d0d14] overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#f0f0f4]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-black text-[17px] tracking-tight text-[#0d0d14]">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-worker flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            Carelink
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium text-[#888] hover:text-[#0d0d14] transition-colors px-2">
              Sign in
            </Link>
            <Link href="/for-facilities" className="bg-[#f4f4f6] text-[#555] px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-[#e8e8ec] transition-colors">
              I manage a facility
            </Link>
            <Link
              href="/login"
              className="bg-teal text-[#0d0d14] px-5 py-2.5 rounded-[10px] text-[14px] font-extrabold hover:bg-teal/90 transition-colors"
              style={{ boxShadow: '0 4px 14px rgba(0,201,167,0.3)' }}
            >
              Register Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0d14 0%, #0d2b4a 55%, #0a3d2e 100%)',
          minHeight: '88vh',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '-100px', left: '30%', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(0,201,167,0.12) 0%, transparent 65%)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 text-teal text-[11px] font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-7">
              <span className="w-1.5 h-1.5 bg-teal rounded-full" />
              For RNs, ENs &amp; PCAs across Victoria
            </div>

            <h1 className="text-5xl md:text-[62px] font-black leading-[1.02] tracking-[-3px] text-white mb-5">
              Register with us.<br />
              <span className="text-teal">Start working</span><br />
              in 24 hours.
            </h1>

            <p className="text-[18px] text-white/55 leading-[1.7] mb-8 max-w-[480px]">
              Join hundreds of Victorian healthcare workers who chose to work <strong className="text-white/85 font-semibold">on their own terms.</strong> Pick every shift. Get paid on time. No lock-in. No agency.
            </p>

            {/* Registration CTA — primary action */}
            <div className="mb-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-3 bg-teal text-[#0d0d14] px-9 py-5 rounded-xl font-black text-[18px] hover:bg-teal/90 transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center sm:justify-start"
                style={{ boxShadow: '0 8px 40px rgba(0,201,167,0.35)' }}
              >
                <UserCheck className="w-5 h-5 shrink-0" />
                Register with us — it's free
                <ArrowRight className="w-5 h-5 shrink-0" />
              </Link>
              <p className="text-[12px] text-white/35 mt-3 ml-1">Takes 5 minutes. No credit card. No lock-in.</p>
            </div>

            {/* Compliance & pay reassurance */}
            <div className="flex flex-wrap items-center gap-5 border-t border-white/[0.07] pt-6">
              {[
                { icon: <Shield className="w-3.5 h-3.5" />, label: 'AHPRA verified' },
                { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Award rates always apply' },
                { icon: <Zap className="w-3.5 h-3.5" />, label: 'Aged Care Act 2024' },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-1.5 text-teal">
                  {t.icon}
                  <span className="text-[12px] text-white/40 font-semibold">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Profile card stack */}
          <div className="relative hidden md:block">
            <div className="rounded-[20px] p-6 border border-white/10 mb-3" style={{ background: 'rgba(255,255,255,0.06)', opacity: 0.5, transform: 'translateY(-8px) scale(0.97)' }}>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-extrabold text-[15px] text-white shrink-0">MP</div>
                <div>
                  <div className="text-[15px] font-extrabold text-white">Marcus P.</div>
                  <div className="text-[12px] text-white/40 mt-0.5">Enrolled Nurse · 4 yrs</div>
                </div>
                <span className="ml-auto text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide bg-teal/15 border border-teal/25 text-teal">Active</span>
              </div>
            </div>

            <div className="rounded-[20px] p-6 border mb-3" style={{ background: 'rgba(255,255,255,0.09)', borderColor: 'rgba(0,201,167,0.25)', boxShadow: '0 0 40px rgba(0,201,167,0.08)' }}>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-worker flex items-center justify-center font-extrabold text-[15px] text-white shrink-0">JP</div>
                <div>
                  <div className="text-[15px] font-extrabold text-white">Jessica P., RN</div>
                  <div className="text-[12px] text-white/40 mt-0.5">Registered Nurse · 6 yrs</div>
                </div>
                <span className="ml-auto text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide bg-teal/15 border border-teal/25 text-teal">✓ Verified</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{ val: '47', label: 'Shifts done', teal: true }, { val: '4.9★', label: 'Rating', teal: false }, { val: '100%', label: 'Compliant', teal: true }].map(s => (
                  <div key={s.label} className="rounded-[10px] px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className={`text-[17px] font-black tracking-tight ${s.teal ? 'text-teal' : 'text-white'}`}>{s.val}</div>
                    <div className="text-[10px] text-white/35 mt-0.5 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Available Tue', 'Available Thu', 'Melbourne CBD', 'Richmond'].map((t, i) => (
                  <span key={t} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${i < 2 ? 'bg-teal/12 text-teal' : 'text-white/55'}`} style={i >= 2 ? { background: 'rgba(255,255,255,0.06)' } : {}}>{t}</span>
                ))}
              </div>
            </div>

            {/* Floating notification */}
            <div className="absolute -bottom-3 -right-5 bg-white rounded-2xl px-4 py-3 flex items-center gap-2.5 animate-float" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
              <div className="w-8 h-8 bg-[#ebfbf8] rounded-[9px] flex items-center justify-center text-base shrink-0">🔔</div>
              <div>
                <div className="text-[13px] font-extrabold text-[#0d0d14]">New shift matched</div>
                <div className="text-[11px] text-[#888] mt-0.5">Sunrise Aged Care · Tomorrow 7am</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Registration is easy ─────────────────────────────────────────── */}
      <section className="bg-[#f8f9fb] border-b border-[#edf0f5]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal mb-3">Getting registered</div>
            <h2 className="text-3xl md:text-[42px] font-black tracking-[-2px]">
              Three steps. Under 10 minutes.<br />
              <span className="text-teal">You're probably already compliant.</span>
            </h2>
            <p className="text-[16px] text-[#666] mt-4 max-w-xl mx-auto">
              Most workers already have everything they need. You upload it once — we store it securely, track expiry dates, and share it with facilities automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                step: '1',
                icon: <UserCheck className="w-6 h-6 text-teal" />,
                title: 'Create your profile',
                time: '~ 3 minutes',
                items: [
                  'Name, role (RN / EN / PCA)',
                  'Availability & preferred locations',
                  'Brief work history',
                ],
                note: 'No CV needed — just the basics.',
              },
              {
                step: '2',
                icon: <Upload className="w-6 h-6 text-teal" />,
                title: 'Upload your documents',
                time: '~ 5 minutes',
                items: [
                  'AHPRA registration number',
                  'Current National Police Check',
                  'Vaccination record (COVID + flu)',
                ],
                note: 'Upload once. We track renewals for you.',
              },
              {
                step: '3',
                icon: <Zap className="w-6 h-6 text-teal" />,
                title: 'Go live & get matched',
                time: 'Instant',
                items: [
                  'Profile reviewed same business day',
                  'Shifts matched to your availability',
                  'Award rates apply — minimum guaranteed',
                ],
                note: 'Most workers book their first shift within 24 hrs.',
              },
            ].map((s, i) => (
              <div key={s.step} className="bg-white rounded-2xl p-7 border border-[#edf0f5] relative">
                <div className="absolute top-5 right-5 text-[11px] font-extrabold text-teal bg-teal/8 px-2.5 py-1 rounded-full">{s.time}</div>
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center mb-4">{s.icon}</div>
                <div className="text-[11px] font-extrabold text-[#bbb] mb-1.5 uppercase tracking-wide">Step {s.step}</div>
                <h3 className="text-[19px] font-black tracking-tight mb-4 text-[#0d0d14]">{s.title}</h3>
                <ul className="space-y-2 mb-4">
                  {s.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-[#555]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[12px] text-[#aaa] italic">{s.note}</p>
                {i < 2 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-[#edf0f5] rounded-full items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-teal" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Inline register CTA */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 bg-teal text-[#0d0d14] px-10 py-4 rounded-xl font-extrabold text-[16px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: '0 6px 28px rgba(0,201,167,0.3)' }}
            >
              <UserCheck className="w-5 h-5" />
              Register now — free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[12px] text-[#bbb] mt-3">No credit card · No agency fees · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── Identity ────────────────────────────────────────────────────── */}
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
            { num: '01', icon: <Calendar className="w-7 h-7" />, title: 'You pick every shift', body: 'Browse what\'s available, accept what fits your life. Tuesday morning only? Night shifts only? Your choice. Nobody calls you at 6am.', highlight: false },
            { num: '02', icon: <Shield className="w-7 h-7" />, title: 'Every facility is vetted', body: 'You know exactly where you\'re going before you arrive. Every facility is rated by other workers — the good ones and the ones to avoid.', highlight: true },
            { num: '03', icon: <Smartphone className="w-7 h-7" />, title: 'Clock in. Go home. Done.', body: 'Clock in on your phone. Hours logged automatically. No paperwork. No chasing anyone. Your record is yours — portable and always current.', highlight: false },
          ].map((card, i) => (
            <div
              key={card.num}
              className={`px-9 py-10 ${card.highlight ? 'bg-[#0d0d14] text-white rounded-2xl shadow-2xl relative z-10' : 'bg-[#f8f9fb] ' + (i === 0 ? 'rounded-l-2xl' : 'rounded-r-2xl')}`}
              style={card.highlight ? { transform: 'scale(1.02)' } : {}}
            >
              <div className="text-[11px] font-extrabold mb-5" style={{ color: card.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>{card.num}</div>
              <div className={`mb-4 ${card.highlight ? 'text-teal' : 'text-[#0d0d14]'}`}>{card.icon}</div>
              <h3 className={`text-[20px] font-black tracking-tight mb-2.5 leading-[1.2] ${card.highlight ? 'text-teal' : 'text-[#0d0d14]'}`}>{card.title}</h3>
              <p className={`text-[14px] leading-[1.65] ${card.highlight ? 'text-white/55' : 'text-[#666]'}`}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles + inline register CTA ─────────────────────────────────── */}
      <section className="border-y border-[#f0f0f4]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#f0f0f4]">
          {[
            { name: 'Registered Nurses', tag: 'RN', desc: 'AHPRA-registered. Hospital or aged care background.', award: 'Nurses Award 2020', gradient: 'bg-gradient-to-br from-sky-400 to-sky-600' },
            { name: 'Enrolled Nurses', tag: 'EN', desc: 'Division 2 nurses. Certificate IV and above.', award: 'Nurses Award 2020', gradient: 'bg-gradient-to-br from-violet-400 to-violet-600' },
            { name: 'Personal Care Assistants', tag: 'PCA', desc: 'Cert III or higher. Aged care or disability experience.', award: 'SCHADS Award', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600' },
          ].map(role => (
            <div key={role.name} className="px-8 py-10 flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${role.gradient} flex items-center justify-center font-black text-white text-[14px]`}>{role.tag}</div>
              <div className="text-[20px] font-black text-[#0d0d14] tracking-tight">{role.name}</div>
              <div className="text-[13px] text-[#aaa] leading-[1.5]">{role.desc}</div>
              <div className="inline-flex items-center gap-1.5 bg-teal/8 border border-teal/15 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-teal shrink-0" />
                <span className="text-[11px] font-extrabold text-teal">{role.award} applies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse-dot" />
                <span className="text-[12px] font-bold text-teal">Shifts available now</span>
              </div>
              <Link
                href="/login"
                className="text-[13px] font-extrabold text-teal hover:text-teal/70 transition-colors flex items-center gap-1"
              >
                Register as {role.tag} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mid-page register banner ─────────────────────────────────────── */}
      <section
        className="py-16 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #0d2b4a 0%, #0a3d2e 100%)' }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-[13px] font-bold text-teal/70 uppercase tracking-[2px] mb-3">Join today</p>
          <h2 className="text-3xl md:text-[40px] font-black tracking-[-2px] text-white mb-4">
            Ready to register?
          </h2>
          <p className="text-[16px] text-white/50 mb-8">
            It takes 5 minutes. Your compliance documents are stored securely and you'll be matched to shifts immediately after approval.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-teal text-[#0d0d14] px-10 py-5 rounded-xl font-black text-[17px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: '0 8px 40px rgba(0,201,167,0.3)' }}
          >
            <UserCheck className="w-5 h-5" />
            Register with us — free
          </Link>
          <p className="text-[11px] text-white/25 mt-4">AHPRA · Police check · Award rates apply · Aged Care Act 2024</p>
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
            Workers who registered<br />and never looked back.
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2 bg-[#0d0d14] rounded-[20px] p-8">
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
                "I set up my profile on a Sunday. Had my first shift booked by Monday morning. The registration — profile, documents, everything — took me less than 10 minutes."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-extrabold text-[14px] text-white shrink-0">DM</div>
                <div>
                  <div className="font-extrabold text-[14px] text-[#0d0d14]">Daniel M.</div>
                  <div className="text-[12px] text-[#aaa] mt-0.5">PCA · Melbourne CBD</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-8 border border-[#edf0f5]">
              <div className="text-[12px] tracking-[2px] text-amber-400 mb-4">★ ★ ★ ★ ★</div>
              <p className="text-[16px] text-[#2d3748] leading-[1.7] mb-6">
                "I have two kids. The only way nursing works for my family is if I control my hours. Registering was easy — I just uploaded my AHPRA and police check and was live by afternoon."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center font-extrabold text-[14px] text-white shrink-0">KT</div>
                <div>
                  <div className="font-extrabold text-[14px] text-[#0d0d14]">Karen T.</div>
                  <div className="text-[12px] text-[#aaa] mt-0.5">Enrolled Nurse · Geelong</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-5 h-0.5 bg-teal" />
            <span className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal">Get in touch</span>
            <span className="w-5 h-0.5 bg-teal" />
          </div>
          <h2 className="text-3xl md:text-[40px] font-black tracking-[-2px] mb-3">Questions before you register?</h2>
          <p className="text-[16px] text-[#666] leading-[1.7] mb-10 max-w-lg mx-auto">
            We're happy to answer questions about eligibility, compliance documents, or how shifts work before you sign up.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '📧', title: 'Email us', body: 'hello@carelink.app', sub: 'Reply within 24 hours' },
              { icon: '📍', title: 'Based in', body: 'Victoria, Australia', sub: 'Serving aged care facilities statewide' },
              { icon: '🛡', title: 'Compliance', body: 'Aged Care Act 2024', sub: 'AHPRA · Police check · Privacy Act' },
            ].map(item => (
              <div key={item.title} className="bg-[#f8f9fb] rounded-2xl px-6 py-6 text-center border border-[#edf0f5]">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-[#bbb] mb-1">{item.title}</div>
                <div className="text-[15px] font-bold text-[#0d0d14]">{item.body}</div>
                <div className="text-[12px] text-[#aaa] mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
          <a href="mailto:hello@carelink.app" className="inline-flex items-center gap-2 border border-[#e2e8f0] text-[#0d0d14] px-7 py-3.5 rounded-xl font-bold text-[14px] hover:border-teal hover:text-teal transition-colors">
            Send us a message →
          </a>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-32 px-6 text-center" style={{ background: 'linear-gradient(160deg, #0d0d14, #0a2e22 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,201,167,0.12) 0%, transparent 65%)' }} />
        <div className="relative z-10 max-w-[640px] mx-auto">
          <div className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal/60 mb-5">Ready?</div>
          <h2 className="text-5xl md:text-[58px] font-black tracking-[-3px] leading-[1.02] text-white mb-5">
            Register with us.<br />
            <span className="text-teal">Work on your terms.</span>
          </h2>
          <p className="text-[17px] text-white/45 leading-[1.65] mb-10">
            Free to join. Upload your documents once. Get matched to shifts in Victoria immediately after approval.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-teal text-[#0d0d14] px-12 py-5 rounded-xl font-black text-[18px] hover:bg-teal/90 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: '0 8px 40px rgba(0,201,167,0.35)' }}
          >
            <UserCheck className="w-5 h-5" />
            Register with us — free
          </Link>
          <p className="text-[12px] text-white/25 mt-5">No credit card · No lock-in · Award rates guaranteed · AHPRA · Aged Care Act 2024</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-7 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px]" style={{ background: '#0d0d14', borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}>
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
