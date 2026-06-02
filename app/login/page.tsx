'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DEMO_ROLE_OPTIONS, type DemoRoleOption } from '@/lib/demo-roles'
import {
  Activity, ShieldCheck, Building2, Stethoscope,
  AlertCircle, ArrowRight, Eye, EyeOff, Phone, Mail,
  CheckCircle2, ClipboardCheck, UserCheck,
} from 'lucide-react'
import Link from 'next/link'

// ─── Demo role cards ───────────────────────────────────────────────────────

const DEMO_ICONS = {
  admin: ShieldCheck,
  facility: Building2,
  nurse: Stethoscope,
  en: ClipboardCheck,
  pca: UserCheck,
}

function DemoCard({
  role, label, subtitle, icon, gradient, glow,
  loading, disabled, onClick,
}: DemoRoleOption & {
  loading: boolean; disabled: boolean; onClick: (role: string) => void
}) {
  const Icon = DEMO_ICONS[icon]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(role)}
      className={[
        'group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-[220ms] ease-spring',
        'border border-white/10',
        disabled && !loading ? 'opacity-50 cursor-not-allowed' : '',
        !disabled ? 'hover:-translate-y-0.5 hover:border-white/20 cursor-pointer' : '',
      ].join(' ')}
      style={!disabled ? { '--hover-glow': glow } as React.CSSProperties : {}}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
      <div className="absolute inset-0 bg-black/10" />
      {!disabled && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `inset 0 0 40px ${glow}` }}
        />
      )}
      <div className="relative flex items-center gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
          {loading
            ? <svg className="w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <Icon className="w-5 h-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">{label}</p>
          <p className="text-white/65 text-xs mt-0.5 leading-snug truncate">{subtitle}</p>
        </div>
        <ArrowRight className={`w-4 h-4 text-white/40 transition-all duration-200 shrink-0 ${!disabled ? 'group-hover:text-white/80 group-hover:translate-x-0.5' : ''}`} />
      </div>
    </button>
  )
}

// ─── Phone OTP flow ────────────────────────────────────────────────────────

function PhoneAuthForm() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputCls = "h-12 rounded-xl border border-surface-3 bg-surface-1 px-4 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none w-full"

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Normalize: ensure leading + for E.164
    const normalized = phone.trim().replace(/\s+/g, '')
    const e164 = normalized.startsWith('+') ? normalized : `+${normalized}`

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 })
    setLoading(false)

    if (otpError) {
      setError(otpError.message)
    } else {
      setPhone(e164)
      setStep('otp')
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: 'sms',
    })
    setLoading(false)

    if (verifyError) {
      setError(verifyError.message)
      return
    }

    if (data?.user) {
      // Determine destination from role stored in DB
      try {
        const res = await fetch('/api/profile')
        const json = await res.json() as { user?: { role?: string } }
        const role = json.user?.role
        if (role === 'ADMIN') router.push('/dashboard')
        else if (role === 'NURSE' || role === 'EN' || role === 'PCA') router.push('/worker')
        else router.push('/facility')
      } catch {
        router.push('/worker')
      }
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in-up">
        <div className="p-4 bg-teal/5 border border-teal/20 rounded-xl text-sm text-ink/70">
          <p className="font-semibold text-ink text-sm mb-0.5">Code sent</p>
          <p>We sent a 6-digit code to <span className="font-mono font-bold text-ink">{phone}</span></p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoFocus
            className={`${inputCls} text-center text-2xl font-mono tracking-[0.4em]`}
          />
        </div>

        <div className="pt-1 space-y-3">
          <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading || otp.length < 6}>
            {loading
              ? <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <><CheckCircle2 className="w-4 h-4" /> Verify Code</>}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('phone'); setOtp(''); setError(null) }}>
            ← Change number
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Mobile Number</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none" />
          <input
            type="tel"
            placeholder="+61 4XX XXX XXX"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className={`${inputCls} pl-11`}
          />
        </div>
        <p className="text-[11px] text-ink/40 mt-1">Include country code, e.g. +61 for Australia</p>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
          {loading
            ? <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <><Phone className="w-4 h-4" /> Send Code</>}
        </Button>
      </div>
    </form>
  )
}

// ─── Main login form ───────────────────────────────────────────────────────

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const errorMessage = searchParams.get('error')
  const message = searchParams.get('message')

  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email')
  const [isRegistering, setIsRegistering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)

  const handleDemoLogin = useCallback(async (role: string) => {
    setLoadingDemo(role)
    setDemoError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
      const formData = new FormData()
      formData.set('role', role)
      const res = await fetch('/api/demo-login', { method: 'POST', body: formData, signal: controller.signal })
      clearTimeout(timeout)
      const data = await res.json() as { destination?: string; error?: string }
      if (data.destination) { router.push(data.destination); return }
      setDemoError(data.error ?? 'Login failed. Please try again.')
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        setDemoError('Server is waking up — wait a moment and try again.')
      } else {
        setDemoError('Network error. Check your connection.')
      }
    }
    setLoadingDemo(null)
  }, [router])

  const inputBase = "h-12 rounded-xl border border-surface-3 bg-surface-1 px-4 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none w-full"

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* ── Left: Auth Form ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-[380px] space-y-8 animate-fade-in-up">

          {/* Brand */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-electric flex items-center justify-center shadow-btn">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-ink">Carelink</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink leading-tight">
              {isRegistering ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-ink/50 text-sm">
              {isRegistering ? 'Join the Carelink network' : 'Sign in to your account'}
            </p>
          </div>

          {/* Check email banner */}
          {message === 'check-email' && (
            <div className="flex items-start gap-2.5 p-3.5 bg-teal/5 border border-teal/20 rounded-xl text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal mt-0.5" />
              <span className="text-ink/70">
                <span className="font-semibold text-ink">Check your email</span> — we&apos;ve sent a confirmation link.
                Click it to activate your account.
              </span>
            </div>
          )}

          {/* URL error */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{decodeURIComponent(errorMessage)}</span>
            </div>
          )}

          {/* Auth mode tabs — only shown when not registering */}
          {!isRegistering && (
            <div className="flex bg-surface-1 rounded-xl p-1 gap-1">
              {([
                { id: 'email' as const, label: 'Email', icon: Mail },
                { id: 'phone' as const, label: 'Phone', icon: Phone },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAuthMode(id)}
                  className={[
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
                    authMode === id
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-ink/40 hover:text-ink/60',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Phone OTP form */}
          {!isRegistering && authMode === 'phone' && (
            <PhoneAuthForm />
          )}

          {/* Email form */}
          {(isRegistering || authMode === 'email') && (
            <form className="space-y-4">
              {isRegistering && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Full Name</label>
                    <Input name="name" type="text" placeholder="Jane Smith" required={isRegistering} className="h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">I am a…</label>
                    <select name="role" className={inputBase}>
                      <option value="NURSE">Registered Nurse (RN)</option>
                      <option value="EN">Enrolled Nurse (EN)</option>
                      <option value="PCA">Personal Care Assistant (PCA)</option>
                      <option value="FACILITY">Aged Care Facility Manager</option>
                    </select>
                    <p className="text-[11px] text-ink/40 mt-1">
                      Pick the role you want Carelink to match you against.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">
                      Phone <span className="text-ink/30 normal-case tracking-normal font-normal">(optional — for SMS alerts)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none" />
                      <input
                        name="phone"
                        type="tel"
                        placeholder="+61 4XX XXX XXX"
                        className={`${inputBase} pl-11`}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none" />
                  <Input name="email" type="email" placeholder="you@example.com" required className="h-12 pl-11" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Password</label>
                  {!isRegistering && (
                    <Link href="/forgot-password" className="text-xs text-teal hover:underline font-medium">Forgot?</Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {isRegistering ? (
                  <>
                    <Button formAction={signup} className="w-full h-12 text-base font-bold">
                      Create Account <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setIsRegistering(false)}>
                      ← Back to Sign In
                    </Button>
                  </>
                ) : (
                  <>
                    <Button formAction={login} className="w-full h-12 text-base font-bold">
                      Sign In <ArrowRight className="w-4 h-4" />
                    </Button>
                    <div className="relative my-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-surface-3" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-[11px] font-medium text-ink/35 uppercase tracking-widest">or</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 font-semibold"
                      onClick={() => setIsRegistering(true)}
                    >
                      Create new account
                    </Button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Right: Dark demo panel ──────────────────────────────────────── */}
      <div className="bg-mesh relative flex flex-col items-center justify-center px-8 py-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative w-full max-w-[360px] space-y-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div>
            <p className="text-label text-teal/80 mb-2">Live Demo</p>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              Try any portal<br />instantly
            </h2>
            <p className="text-white/45 text-sm mt-2 leading-relaxed">
              One tap — no signup needed. Pre-loaded with real data.
            </p>
          </div>

          {demoError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{demoError}</span>
            </div>
          )}

          <div className="space-y-3 stagger-children">
            {DEMO_ROLE_OPTIONS.map(demo => (
              <DemoCard
                key={demo.role}
                {...demo}
                loading={loadingDemo === demo.role}
                disabled={loadingDemo !== null}
                onClick={handleDemoLogin}
              />
            ))}
          </div>

          <p className="text-white/25 text-xs text-center leading-relaxed">
            Demo accounts are pre-provisioned with live shared data.
            Changes you make are visible to all demo users.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-1" />}>
      <LoginContent />
    </Suspense>
  )
}
