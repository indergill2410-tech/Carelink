'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Activity, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Passwords do not match')
      setStatus('error')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters')
      setStatus('error')
      return
    }

    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      router.push('/login?error=' + encodeURIComponent('Password updated. Please sign in with your new password.'))
    }
  }

  const inputCls = "h-12 w-full rounded-xl border border-surface-3 bg-surface-1 px-4 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none"

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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h1 className="text-xl font-black text-ink tracking-tight">Set new password</h1>
              <p className="text-ink/50 text-xs mt-0.5">Choose a strong password for your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Repeat your new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            {password && confirm && password !== confirm && (
              <p className="text-xs text-rose-500 -mt-2">Passwords don&apos;t match</p>
            )}

            <Button type="submit" className="w-full h-12 font-bold mt-2" disabled={status === 'loading'}>
              {status === 'loading'
                ? <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : 'Update Password'
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
