import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-4 items-center text-center pb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-teal to-mint rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-navy">Welcome to Carelink</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy" htmlFor="email">Email address</label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy" htmlFor="password">Password</label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button formAction={login} className="w-full">Sign In</Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or</span></div>
              </div>
              <Button formAction={signup} variant="outline" className="w-full">Register Account</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
