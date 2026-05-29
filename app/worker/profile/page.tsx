import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { CalendarCheck, Clock, Wallet, UserCircle, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const supabase = await createClient()
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

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect('/login')

    await prisma.user.update({
      where: { id: authUser.id },
      data: { name },
    })

    revalidatePath('/worker/profile')
    redirect('/worker/profile?success=Name+updated+successfully')
  }

  const status = dbUser.complianceStatus ?? 'RED'
  const isCompliant = status === 'GREEN'

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto shadow-card">
      {/* Mobile Header */}
      <header className="mesh-hero text-white px-6 py-6 rounded-b-[2rem] shadow-modal">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-electric font-medium">Profile</p>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-ink text-base">Personal Information</CardTitle>
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
                <span className="bg-ink/10 text-ink text-sm font-bold px-3 py-1 rounded-full">
                  {dbUser.role}
                </span>
              </div>
            </div>

            {/* Compliance Status */}
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Compliance Status</label>
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Name Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-ink text-base">Update Name</CardTitle>
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
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-electric/25"
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
          <Card className="border-l-4 border-l-amber-400">
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
          <Card className="border-l-4 border-l-green-400">
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
      <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[min(92vw,40rem)] -translate-x-1/2 justify-around rounded-3xl border border-white/70 bg-white/85 p-2 shadow-hover backdrop-blur-xl">
        <a href="/worker" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </a>
        <a href="/worker/my-shifts" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Shifts</span>
        </a>
        <a href="/worker/pay" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-gray-400">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Pay</span>
        </a>
        <a href="/worker/profile" className="flex flex-col items-center gap-1 rounded-2xl bg-electric/10 px-4 py-2 text-electric-dim">
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </a>
      </nav>

    </div>
  )
}
