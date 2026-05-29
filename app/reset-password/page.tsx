'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 items-center text-center pb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-teal to-mint rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-navy">Set New Password</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">New Password</label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Confirm Password</label>
              <Input
                type="password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={status === 'loading'}>
              {status === 'loading' ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
