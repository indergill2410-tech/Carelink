'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
    iconBg: 'bg-navy text-white',
    hoverBorder: 'hover:border-teal hover:shadow-md',
  },
  {
    role: 'FACILITY',
    label: 'Facility Client Portal',
    description: 'Request staff, post shifts, view your live roster.',
    icon: <Building2 className="w-6 h-6" />,
    iconBg: 'bg-blue-100 text-blue-600',
    hoverBorder: 'hover:border-blue-400 hover:shadow-md',
  },
  {
    role: 'NURSE',
    label: 'Mobile Worker App',
    description: 'Browse open shifts and accept bookings instantly.',
    icon: <Stethoscope className="w-6 h-6" />,
    iconBg: 'bg-teal-100 text-teal-600',
    hoverBorder: 'hover:border-teal hover:shadow-md',
  },
]

function LoginContent() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get('error')

  const [isRegistering, setIsRegistering] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null)

  // Reset spinner if we're redirected back to /login (e.g. on error)
  useEffect(() => {
    setLoadingDemo(null)
  }, [searchParams])

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">

      {/* Left: Login / Register */}
      <div className="flex flex-col items-center justify-center p-8 bg-white border-r">
        <Card className="w-full max-w-md shadow-none border-0">
          <CardHeader className="space-y-4 items-center text-center pb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-teal to-mint rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-navy">
                {isRegistering ? 'Create an Account' : 'Welcome to Carelink'}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
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
                    <label className="text-sm font-medium text-navy">Full Name</label>
                    <Input name="name" type="text" placeholder="Jane Doe" required={isRegistering} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy">I am a...</label>
                    <select name="role" className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal">
                      <option value="NURSE">Healthcare Worker (RN / EN / PCA)</option>
                      <option value="FACILITY">Aged Care Facility Manager</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Email address</label>
                <Input name="email" type="email" placeholder="name@example.com" required />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-navy">Password</label>
                  {!isRegistering && (
                    <Link href="/forgot-password" className="text-xs text-teal hover:underline">Forgot password?</Link>
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
                        <span className="bg-white px-2 text-gray-500">Or</span>
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
      </div>

      {/* Right: Demo accounts */}
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-navy">Try the Platform</h2>
            <p className="text-gray-500 mt-2 text-sm">
              One tap to enter any portal as a pre-loaded demo account.
              No sign-up needed.
            </p>
          </div>

          <div className="space-y-4">
            {/* Management section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Management</p>
              <div className="space-y-3">
                {DEMO_BUTTONS.filter(({ role }) => role === 'ADMIN' || role === 'FACILITY').map(({ role, label, description, icon, iconBg, hoverBorder }) => {
                  const isLoading = loadingDemo === role
                  const isDisabled = loadingDemo !== null

                  return (
                    <form key={role} method="POST" action="/api/demo-login">
                      <input type="hidden" name="role" value={role} />
                      <button
                        type="submit"
                        disabled={isDisabled}
                        onClick={() => setLoadingDemo(role)}
                        className={`w-full flex items-center p-4 bg-white border rounded-2xl transition-all text-left group
                          ${isDisabled ? 'opacity-60 cursor-not-allowed' : `${hoverBorder} cursor-pointer`}`}
                      >
                        <div className={`p-3 ${iconBg} rounded-xl mr-4 shrink-0 ${!isDisabled ? 'group-hover:scale-105 transition-transform' : ''}`}>
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-navy text-sm">{label}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                        </div>
                        {isLoading && (
                          <span className="text-xs text-gray-400 ml-2 shrink-0">Loading…</span>
                        )}
                      </button>
                    </form>
                  )
                })}
              </div>
            </div>

            {/* Healthcare Workers section */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Healthcare Workers</p>
              <div className="space-y-3">
                {DEMO_BUTTONS.filter(({ role }) => role === 'NURSE').map(({ role, label, description, icon, iconBg, hoverBorder }) => {
                  const isLoading = loadingDemo === role
                  const isDisabled = loadingDemo !== null

                  return (
                    <form key={role} method="POST" action="/api/demo-login">
                      <input type="hidden" name="role" value={role} />
                      <button
                        type="submit"
                        disabled={isDisabled}
                        onClick={() => setLoadingDemo(role)}
                        className={`w-full flex items-center p-4 bg-white border rounded-2xl transition-all text-left group
                          ${isDisabled ? 'opacity-60 cursor-not-allowed' : `${hoverBorder} cursor-pointer`}`}
                      >
                        <div className={`p-3 ${iconBg} rounded-xl mr-4 shrink-0 ${!isDisabled ? 'group-hover:scale-105 transition-transform' : ''}`}>
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-navy text-sm">{label}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                        </div>
                        {isLoading && (
                          <span className="text-xs text-gray-400 ml-2 shrink-0">Loading…</span>
                        )}
                      </button>
                    </form>
                  )
                })}
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400">
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
