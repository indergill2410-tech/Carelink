'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 items-center text-center pb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-teal to-mint rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-navy">Reset Password</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Enter your email and we&apos;ll send you a reset link</p>
          </div>
        </CardHeader>

        <CardContent>
          {status === 'sent' ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-navy font-semibold">Check your inbox</p>
              <p className="text-sm text-gray-500">
                We sent a reset link to <strong>{email}</strong>. It expires in 1 hour.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Email address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" className="w-full" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
                </Button>
                <Link href="/login">
                  <Button type="button" variant="ghost" className="w-full">Back to Sign In</Button>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
