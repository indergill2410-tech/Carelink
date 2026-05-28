'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
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
          <form className="space-y-4">

            {isRegistering && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy" htmlFor="name">Full Name</label>
                  <Input id="name" name="name" type="text" placeholder="Jane Doe" required={isRegistering} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-navy" htmlFor="role">I am a...</label>
                  <select name="role" id="role" className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal">
                    <option value="NURSE">Healthcare Worker (RN/EN/PCA)</option>
                    <option value="FACILITY">Aged Care Facility Manager</option>
                    <option value="ADMIN">Agency Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-navy" htmlFor="email">Email address</label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-navy" htmlFor="password">Password</label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
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
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or</span></div>
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
  )
}
