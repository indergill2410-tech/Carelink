'use client'

import { useState } from 'react'
import { login, signup, demoLogin } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Activity, ShieldCheck, Building2, Stethoscope } from 'lucide-react'

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false)

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">

      {/* Left Side: Standard Login/Register */}
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
                      <option value="NURSE">Healthcare Worker (RN/EN/PCA)</option>
                      <option value="FACILITY">Aged Care Facility Manager</option>
                      <option value="ADMIN">Agency Administrator</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Email address</label>
                <Input name="email" type="email" placeholder="name@example.com" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Password</label>
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

      {/* Right Side: Demo Environment CTAs */}
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-navy">Explore the Platform</h2>
            <p className="text-gray-500 mt-2">Log in with one-click demo accounts to see how the three portals interact in real-time.</p>
          </div>

          <form action={demoLogin} className="space-y-4">
            <button type="submit" name="demo_role" value="ADMIN" className="w-full flex items-center p-4 bg-white border rounded-2xl hover:border-teal hover:shadow-md transition-all text-left group">
              <div className="p-3 bg-navy text-white rounded-xl mr-4 group-hover:scale-105 transition-transform"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-navy">Agency Admin Dashboard</h3>
                <p className="text-sm text-gray-500">Manage compliance, view live global dispatch.</p>
              </div>
            </button>

            <button type="submit" name="demo_role" value="FACILITY" className="w-full flex items-center p-4 bg-white border rounded-2xl hover:border-blue-500 hover:shadow-md transition-all text-left group">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mr-4 group-hover:scale-105 transition-transform"><Building2 className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-navy">Facility Client Portal</h3>
                <p className="text-sm text-gray-500">Request staff and view facility roster.</p>
              </div>
            </button>

            <button type="submit" name="demo_role" value="NURSE" className="w-full flex items-center p-4 bg-white border rounded-2xl hover:border-mint hover:shadow-md transition-all text-left group">
              <div className="p-3 bg-mint/20 text-mint rounded-xl mr-4 group-hover:scale-105 transition-transform"><Stethoscope className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-navy">Mobile Worker App</h3>
                <p className="text-sm text-gray-500">View available shifts and accept bookings.</p>
              </div>
            </button>
            <p className="text-xs text-center text-gray-400 pt-4">Demo accounts are automatically provisioned in the secure Supabase database upon clicking.</p>
          </form>
        </div>
      </div>

    </div>
  )
}
