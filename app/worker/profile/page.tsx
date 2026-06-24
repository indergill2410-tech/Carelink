import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { UserCircle } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { WorkerBottomNav } from '@/components/worker/WorkerBottomNav'
import ProfileClient from './ProfileClient'
import { normalizeAvailability } from '@/lib/availability'

export const dynamic = 'force-dynamic'

async function getSignedDocUrl(path: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return null
  const storageClient = createServerClient(
    supabaseUrl,
    serviceKey,
    {
      global: { headers: { origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' } },
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
    },
  )
  const { data } = await storageClient.storage
    .from('compliance-docs')
    .createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

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

  const docsWithUrls = await Promise.all(
    documents.map(async d => ({
      docType:    d.docType,
      status:     d.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'MISSING',
      expiresAt:  d.expiresAt?.toISOString() ?? null,
      reviewNote: d.reviewNote,
      url:        d.url ? await getSignedDocUrl(d.url) : null,
    }))
  )

  const profileData = {
    user: {
      id:               dbUser.id,
      name:             dbUser.name,
      email:            dbUser.email,
      role:             dbUser.role as string,
      complianceStatus: dbUser.complianceStatus,
      phone:            dbUser.phone,
      skills:           dbUser.skills,
      rating:           dbUser.rating,
      availability:     normalizeAvailability(dbUser.availability),
    },
    documents: docsWithUrls,
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto relative">

      {/* Header */}
      <header className="relative overflow-hidden bg-ink px-6 pt-6 pb-7">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-teal/80 uppercase tracking-widest mb-0.5">Profile</p>
            <h1 className="font-black text-white text-xl tracking-tight">{dbUser.name ?? 'Worker'}</h1>
            <p className="text-white/40 text-xs mt-0.5">{dbUser.email}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>
        {/* Role + compliance badge row */}
        <div className="relative flex items-center gap-2 mt-4">
          <span className="glass px-3 py-1.5 rounded-xl text-white/80 text-xs font-bold uppercase tracking-wide">
            {dbUser.role}
          </span>
          {dbUser.complianceStatus && (
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide ${
              dbUser.complianceStatus === 'GREEN'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/25'
                : dbUser.complianceStatus === 'AMBER'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/25'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/25'
            }`}>
              {dbUser.complianceStatus === 'GREEN' ? '✓ Compliant' : 'Docs Required'}
            </span>
          )}
          {dbUser.rating && (
            <span className="ml-auto glass px-3 py-1.5 rounded-xl text-white/80 text-xs font-bold font-mono">
              ⭐ {dbUser.rating.toFixed(1)}
            </span>
          )}
        </div>
      </header>

      <ProfileClient initialData={profileData} />

      <WorkerBottomNav />
    </div>
  )
}
