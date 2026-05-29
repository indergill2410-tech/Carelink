'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Activity, ShieldCheck, Building2, Stethoscope, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const DEMO_BUTTONS = [
  {
    role: 'ADMIN',
    label: 'Agency Admin Dashboard',
    description: 'Global dispatch, compliance monitoring, workforce overview.',
    icon: <ShieldCheck className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
    hoverBorder: 'hover:border-amber-200 hover:shadow-hover',
  },
  {
    role: 'FACILITY',
    label: 'Facility Client Portal',
    description: 'Request staff, post shifts, view your live roster.',
    icon: <Building2 className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-pulse-blue to-sky-400 text-white',
    hoverBorder: 'hover:border-blue-200 hover:shadow-hover',
  },
  {
    role: 'NURSE',
    label: 'Mobile Worker App',
    description: 'Browse open shifts and accept bookings instantly.',
    icon: <Stethoscope className="w-6 h-6" />,
    iconBg: 'bg-gradient-to-br from-electric to-emerald-400 text-white',
    hoverBorder: 'hover:border-electric/40 hover:shadow-hover',
  },
]

function DemoButton({
  role, label, description, icon, iconBg, hoverBorder,
  isLoading, isDisabled,
  onClick,
}: {
  role: string
  label: string
  description: string
  icon: React.ReactNode
  iconBg: string
  hoverBorder: string
  isLoading: boolean
  isDisabled: boolean
  onClick: (role: string) => void
}) {
  const showDisabledStyle = isDisabled && !isLoading
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onClick(role)}
      className={`w-full flex items-center p-4 bg-white/95 border border-white/70 rounded-2xl shadow-card transition-all duration-200 ease-spring text-left group
        ${showDisabledStyle ? 'opacity-60 cursor-not-allowed' : ''}
        ${!isDisabled ? `${hoverBorder} cursor-pointer hover:-translate-y-0.5` : ''}`}
    >
      <div className={`p-3 ${iconBg} rounded-xl mr-4 shrink-0 ${!isDisabled ? 'group-hover:scale-105 transition-transform' : ''}`}>
        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-ink text-sm">{label}</h3>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      {isLoading && (
        <span className="text-xs text-slate-400 ml-2 shrink-0">Signing in...</span>
      )}
    </button>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const errorMessage = searchParams.get('error')

  const [isRegistering, setIsRegistering] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)

  const handleDemoLogin = useCallback(async (role: string) => {
    setLoadingDemo(role)
    setDemoError(null)

    const controller = new AbortController()
    // Abort after 25 seconds — Render free tier drops requests at 30s
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
      const formData = new FormData()
      formData.set('role', role)

      const res = await fetch('/api/demo-login', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const data = await res.json() as { destination?: string; error?: string }

      if (data.destination) {
        router.push(data.destination)
        // Keep spinner until navigation completes
        return
      }

      setDemoError(data.error ?? 'Login failed. Please try again.')
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        setDemoError('The server is waking up — please wait a moment and try again.')
      } else {
        setDemoError('Network error. Please check your connection and try again.')
      }
    }

    setLoadingDemo(null)
  }, [router])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] bg-background">

      {/* Left: Login / Register */}
      <div className="mesh-hero flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 text-white">
        <div className="w-full max-w-xl">
          <div className="mb-10">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-electric">
              <Activity className="h-6 w-6 text-electric" />
            </div>
            <h1 className="text-5xl font-black tracking-normal sm:text-6xl">Carelink</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
              Premium healthcare workforce command for agencies, facilities, and mobile clinicians.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['Dispatch', 'Compliance', 'Rostering'].map((label) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <div className="mt-3 h-1.5 rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-electric to-pulse-blue" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-8 lg:p-10 bg-[radial-gradient(circle_at_top_right,rgba(0,201,167,0.13),transparent_32%),linear-gradient(180deg,#ffffff,#f7fafc)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 items-center text-center pb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-electric to-electric-dim rounded-2xl flex items-center justify-center shadow-electric">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-ink">
                {isRegistering ? 'Create an Account' : 'Welcome to Carelink'}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {isRegistering ? 'Join the healthcare network' : 'Sign in to your account'}
              </p>
            </div>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{decodeURIComponent(errorMessage)}</span>
              </div>
            )}

            <form className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-ink">Full Name</label>
                    <Input name="name" type="text" placeholder="Jane Doe" required={isRegistering} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-ink">I am a...</label>
                    <select name="role" className="w-full flex h-12 rounded-xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/25">
                      <option value="NURSE">Healthcare Worker (RN / EN / PCA)</option>
                      <option value="FACILITY">Aged Care Facility Manager</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink">Email address</label>
                <Input name="email" type="email" placeholder="name@example.com" required />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-ink">Password</label>
                  {!isRegistering && (
                    <Link href="/forgot-password" className="text-xs text-electric-dim hover:underline">Forgot password?</Link>
                  )}
                </div>
                <Input name="password" type="password" placeholder="••••••••" required />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                {isRegistering ? (
                  <>
                    <Button formAction={signup} className="w-full">Complete Registration</Button>
                    <Button type="button" variant="ghost" onClick={() => setIsRegistering(false)}>
                      Back to Sign In
                    </Button>
                  </>
                ) : (
                  <>
                    <Button formAction={login} className="w-full">Sign In</Button>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500">Or</span>
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setIsRegistering(true)}>
                      Register New Account
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        {/* Demo accounts */}
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-ink">Try the Platform</h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              One tap to enter any portal as a pre-loaded demo account.
              No sign-up needed.
            </p>
          </div>

          {demoError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{demoError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Management</p>
              <div className="space-y-3">
                {DEMO_BUTTONS.filter(({ role }) => role === 'ADMIN' || role === 'FACILITY').map((btn) => (
                  <DemoButton
                    key={btn.role}
                    {...btn}
                    isLoading={loadingDemo === btn.role}
                    isDisabled={loadingDemo !== null}
                    onClick={handleDemoLogin}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Healthcare Workers</p>
              <div className="space-y-3">
                {DEMO_BUTTONS.filter(({ role }) => role === 'NURSE').map((btn) => (
                  <DemoButton
                    key={btn.role}
                    {...btn}
                    isLoading={loadingDemo === btn.role}
                    isDisabled={loadingDemo !== null}
                    onClick={handleDemoLogin}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-slate-400 leading-relaxed">
            Demo accounts are pre-confirmed and provisioned automatically.
            Each portal is fully interactive with shared live data.
          </p>
        </div>
      </div>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  )
}
