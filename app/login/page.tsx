'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Activity, ShieldCheck, Building2, Stethoscope,
  AlertCircle, ArrowRight, Eye, EyeOff,
} from 'lucide-react'
import Link from 'next/link'

// ─── Demo role cards ───────────────────────────────────────────────────────

const DEMO_ROLES = [
  {
    role: 'ADMIN',
    label: 'Agency Admin',
    subtitle: 'Global dispatch · Compliance · Analytics',
    icon: ShieldCheck,
    gradient: 'from-violet-600 to-indigo-700',
    glow: 'rgba(139,92,246,0.35)',
    destination: '/dashboard',
  },
  {
    role: 'FACILITY',
    label: 'Facility Manager',
    subtitle: 'Post shifts · Live roster · Spend tracking',
    icon: Building2,
    gradient: 'from-sky-500 to-blue-700',
    glow: 'rgba(14,165,233,0.35)',
    destination: '/facility',
  },
  {
    role: 'NURSE',
    label: 'Healthcare Worker',
    subtitle: 'Browse shifts · Clock in/out · Pay history',
    icon: Stethoscope,
    gradient: 'from-teal to-electric-dim',
    glow: 'rgba(0,201,167,0.35)',
    destination: '/worker',
  },
]

function DemoCard({
  role, label, subtitle, icon: Icon, gradient, glow,
  loading, disabled, onClick,
}: (typeof DEMO_ROLES)[number] & {
  loading: boolean; disabled: boolean; onClick: (role: string) => void
}) {
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
      {/* gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
      {/* noise overlay */}
      <div className="absolute inset-0 bg-black/10" />
      {/* hover glow */}
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

// ─── Main login form ───────────────────────────────────────────────────────

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const errorMessage = searchParams.get('error')

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

  const inputBase = "h-12 rounded-xl border-surface-3 bg-surface-1 px-4 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none w-full"

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* ── Left: Sign In Form ─────────────────────────────────────────── */}
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

          {/* Error */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{decodeURIComponent(errorMessage)}</span>
            </div>
          )}

          {/* Form */}
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
                    <option value="NURSE">Healthcare Worker (RN / EN / PCA)</option>
                    <option value="FACILITY">Aged Care Facility Manager</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Email address</label>
              <Input name="email" type="email" placeholder="you@example.com" required className="h-12" />
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
        </div>
      </div>

      {/* ── Right: Dark demo panel ──────────────────────────────────────── */}
      <div className="bg-mesh relative flex flex-col items-center justify-center px-8 py-12 overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative w-full max-w-[360px] space-y-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          {/* Heading */}
          <div>
            <p className="text-label text-teal/80 mb-2">Live Demo</p>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              Try any portal<br />instantly
            </h2>
            <p className="text-white/45 text-sm mt-2 leading-relaxed">
              One tap — no signup needed. Pre-loaded with real data.
            </p>
          </div>

          {/* Demo error */}
          {demoError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{demoError}</span>
            </div>
          )}

          {/* Role cards */}
          <div className="space-y-3 stagger-children">
            {DEMO_ROLES.map(demo => (
              <DemoCard
                key={demo.role}
                {...demo}
                loading={loadingDemo === demo.role}
                disabled={loadingDemo !== null}
                onClick={handleDemoLogin}
              />
            ))}
          </div>

          {/* Footer note */}
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
