import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { ShieldCheck, AlertTriangle, Clock, FileCheck2, ArrowRight, Upload } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { NotificationBell } from '@/components/NotificationBell'
import { WorkerBottomNav } from '@/components/worker/WorkerBottomNav'
import {
  COMPLIANCE_DOCUMENTS,
  getRequiredComplianceDocTypes,
  getEffectiveDocumentStatus,
  getExpiryBucket,
  getDaysUntilExpiry,
  getComplianceProgress,
  type ComplianceDocumentLike,
} from '@/lib/compliance'

export const dynamic = 'force-dynamic'

const TZ = 'Australia/Melbourne'

export default async function CredentialsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) redirect('/login')

  const documents = await prisma.complianceDocument.findMany({ where: { userId: user.id } })
  const byType = new Map<string, ComplianceDocumentLike>(documents.map(d => [d.docType, d as ComplianceDocumentLike]))
  const required = getRequiredComplianceDocTypes(dbUser.role)
  const labelByType = new Map(COMPLIANCE_DOCUMENTS.map(d => [d.key, d.label]))
  const progress = getComplianceProgress(dbUser.role, documents)
  const now = new Date()

  // Build the credential rows, sorted: expired → expiring → missing/rejected → pending → valid.
  const rows = required.map(type => {
    const doc = byType.get(type)
    const status = getEffectiveDocumentStatus(doc, now)
    const bucket = doc ? getExpiryBucket(doc, now) : 'NO_EXPIRY'
    const days = doc ? getDaysUntilExpiry(doc.expiresAt, now) : null
    return { type, label: labelByType.get(type) ?? type, status, bucket, days, expiresAt: doc?.expiresAt ?? null }
  })

  const rank = (r: typeof rows[number]) => {
    if (r.status === 'EXPIRED') return 0
    if (r.bucket === 'EXPIRING_SOON') return 1
    if (r.status === 'MISSING' || r.status === 'REJECTED') return 2
    if (r.status === 'PENDING') return 3
    return 4
  }
  rows.sort((a, b) => rank(a) - rank(b))

  const atRisk = rows.filter(r => r.status === 'EXPIRED' || r.bucket === 'EXPIRING_SOON' || r.status === 'MISSING' || r.status === 'REJECTED')

  function StatusChip({ r }: { r: typeof rows[number] }) {
    if (r.status === 'EXPIRED')
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle className="w-2.5 h-2.5" /> Expired</span>
    if (r.status === 'MISSING')
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-surface-2 text-ink/45 border border-surface-3">Not uploaded</span>
    if (r.status === 'REJECTED')
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>
    if (r.status === 'PENDING')
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-2.5 h-2.5" /> In review</span>
    if (r.bucket === 'EXPIRING_SOON')
      return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-2.5 h-2.5" /> Expiring soon</span>
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><ShieldCheck className="w-2.5 h-2.5" /> Valid</span>
  }

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col max-w-2xl mx-auto">
      <header className="relative bg-ink text-white overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
        <div className="relative px-5 pt-5 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal/80 text-xs font-semibold tracking-widest uppercase mb-0.5">Credentials</p>
              <h1 className="text-2xl font-black tracking-tight text-white">Compliance centre</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell />
              <LogoutButton />
            </div>
          </div>
          {/* Progress */}
          <div className="mt-5 glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Verification progress</p>
              <p className="text-white font-black font-mono text-sm">{progress.approved}/{progress.total}</p>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal to-mint transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 space-y-4 overflow-y-auto">
        {atRisk.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm">
                {atRisk.length === 1 ? '1 credential needs attention' : `${atRisk.length} credentials need attention`}
              </p>
              <p className="text-amber-700 text-xs mt-0.5">Keep your documents current to stay eligible for shifts.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-surface-3 shadow-card overflow-hidden divide-y divide-surface-1">
          {rows.map(r => (
            <div key={r.type} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-surface-1 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-4 h-4 text-ink/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-sm leading-tight">{r.label}</p>
                <p className="text-xs text-ink/40 mt-0.5">
                  {r.expiresAt
                    ? r.days != null && r.days < 0
                      ? `Expired ${Math.abs(r.days)} days ago`
                      : `Expires ${new Date(r.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })}${r.days != null && r.days <= 60 ? ` · ${r.days}d` : ''}`
                    : r.status === 'MISSING' ? 'Upload to get verified' : 'No expiry'}
                </p>
              </div>
              <StatusChip r={r} />
            </div>
          ))}
        </div>

        <a href="/worker/profile" className="flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-surface-3 shadow-card hover:border-teal/40 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-teal" />
            </div>
            <div>
              <p className="font-bold text-ink text-sm">Upload or replace a document</p>
              <p className="text-ink/45 text-xs mt-0.5">Add new certificates or renew an expiring one.</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-ink/25 group-hover:translate-x-0.5 transition-transform" />
        </a>

        <p className="text-center text-[11px] text-ink/35 px-6 leading-relaxed">
          All carers are police-checked and AHPRA-verified before every shift. Your documents are stored securely and only shared with facilities you work for.
        </p>
      </main>

      <WorkerBottomNav />
    </div>
  )
}
