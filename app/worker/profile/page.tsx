import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Clock, Wallet, UserCircle, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  async function updateName(formData: FormData) {
    'use server'
    const name = (formData.get('name') as string)?.trim()

    if (!name || name.length < 2 || name.length > 100) {
      redirect('/worker/profile?error=Name+must+be+between+2+and+100+characters')
    }

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    await prisma.user.update({
      where: { id: authUser.id },
      data: { name },
    })

    revalidatePath('/worker/profile')
    redirect('/worker/profile?success=Name+updated+successfully')
  }

  const complianceColor: Record<string, string> = {
    GREEN: 'bg-green-100 text-green-700',
    AMBER: 'bg-amber-100 text-amber-700',
    RED: 'bg-red-100 text-red-700',
  }

  const status = dbUser.complianceStatus ?? 'RED'
  const complianceBadgeClass = complianceColor[status] ?? complianceColor.RED
  const isCompliant = status === 'GREEN'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:hidden">
      {/* Mobile Header */}
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">Profile</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24 space-y-5">
        {/* Feedback Messages */}
        {searchParams.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}
        {searchParams.success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {decodeURIComponent(searchParams.success)}
          </div>
        )}

        {/* Profile Info Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</label>
              <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{dbUser.email}</p>
            </div>

            {/* Role */}
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Role</label>
              <div className="mt-1">
                <span className="bg-navy/10 text-navy text-sm font-bold px-3 py-1 rounded-full">
                  {dbUser.role}
                </span>
              </div>
            </div>

            {/* Compliance Status */}
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Compliance Status</label>
              <div className="mt-1">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${complianceBadgeClass}`}>
                  {status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Name Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy text-base">Update Name</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateName} className="space-y-3">
              <div>
                <label htmlFor="name" className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Display Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={dbUser.name ?? ''}
                  minLength={2}
                  maxLength={100}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Your full name"
                />
              </div>
              <Button type="submit" className="w-full font-bold">
                Save Name
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Compliance Notice */}
        {!isCompliant && (
          <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-700 text-sm">Compliance Required</p>
                <p className="text-sm text-gray-600 mt-1">
                  Upload your compliance documents to start accepting shifts. Contact your agency to submit documents.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isCompliant && (
          <Card className="border-0 shadow-sm border-l-4 border-l-green-400">
            <CardContent className="p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-700 text-sm">Fully Compliant</p>
                <p className="text-sm text-gray-600 mt-1">
                  You are cleared to accept shifts. Keep your documents up to date.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe">
        <a href="/worker" className="flex flex-col items-center gap-1 text-gray-400">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 text-gray-400">
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Shifts</span>
        </a>
        <a href="/worker/pay" className="flex flex-col items-center gap-1 text-gray-400">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </a>
        <a href="/worker/profile" className="flex flex-col items-center gap-1 text-teal-600">
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </a>
      </nav>

      {/* Desktop overlay */}
      <div className="hidden md:flex fixed inset-0 bg-navy/90 z-50 items-center justify-center p-8 text-center text-white">
        <div className="max-w-md space-y-4">
          <Stethoscope className="w-12 h-12 mx-auto text-teal-400" />
          <h2 className="text-2xl font-bold">Mobile View Only</h2>
          <p className="text-gray-300">The Worker App is designed for mobile. Open this on a phone or shrink your browser window.</p>
          <a href="/dashboard" className="inline-block mt-4 text-teal-400 underline">Return to Admin Dashboard</a>
        </div>
      </div>
    </div>
  )
}
