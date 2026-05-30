'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Activity, AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?type=recovery`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] animate-fade-in-up">

        {/* Brand header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-electric flex items-center justify-center shadow-btn">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-ink">Carelink</span>
        </div>

        <div className="bg-white rounded-2xl border border-surface-2 shadow-card p-8">

          {status === 'sent' ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-ink tracking-tight">Check your inbox</h1>
                <p className="text-ink/50 text-sm mt-2 leading-relaxed">
                  We sent a reset link to <strong className="text-ink font-semibold">{email}</strong>.
                  It expires in 1 hour.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-ink tracking-tight leading-tight">Reset password</h1>
                <p className="text-ink/50 text-sm mt-1">Enter your email and we&apos;ll send a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-12 w-full rounded-xl border border-surface-3 bg-surface-1 pl-11 pr-4 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1 space-y-3">
                  <Button type="submit" className="w-full h-12 font-bold" disabled={status === 'loading'}>
                    {status === 'loading'
                      ? <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      : 'Send Reset Link'
                    }
                  </Button>
                  <Link href="/login">
                    <Button type="button" variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4" /> Back to Sign In
                    </Button>
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
