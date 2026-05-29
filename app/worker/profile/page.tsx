import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { CalendarCheck, Clock, Wallet, UserCircle } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [dbUser, documents] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.complianceDocument.findMany({
      where: { userId: user.id },
      orderBy: { docType: 'asc' },
    }),
  ])

  if (!dbUser) redirect('/login')

  const profileData = {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as string,
      complianceStatus: dbUser.complianceStatus,
      phone: dbUser.phone,
      skills: dbUser.skills,
      rating: dbUser.rating,
    },
    documents: documents.map(d => ({
      docType: d.docType,
      status: d.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'MISSING',
      expiresAt: d.expiresAt?.toISOString() ?? null,
      reviewNote: d.reviewNote,
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <header className="bg-navy text-white px-6 py-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-200 font-medium">Profile</p>
            <h1 className="font-bold text-xl">{dbUser.name ?? 'Worker'}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <ProfileClient initialData={profileData} />

      <nav className="fixed bottom-0 w-full max-w-2xl bg-white border-t flex justify-around p-3 pb-safe">
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
    </div>
  )
}
