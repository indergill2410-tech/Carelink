'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertCircle, CheckCircle2, Upload, FileText,
  Loader2, XCircle, Clock, Shield,
} from 'lucide-react'

type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'MISSING'

const DOC_TYPES = [
  { key: 'POLICE_CHECK',          label: 'Police Check',                  required: true  },
  { key: 'WORKING_WITH_CHILDREN', label: 'Working With Children Check',   required: true  },
  { key: 'FIRST_AID',             label: 'First Aid Certificate',         required: true  },
  { key: 'IMMUNISATION',          label: 'Immunisation Record',           required: true  },
  { key: 'NURSING_REGISTRATION',  label: 'AHPRA Registration',            required: false },
  { key: 'ID_PROOF',              label: 'Photo ID',                      required: true  },
]

const REQUIRED_KEYS = DOC_TYPES.filter(d => d.required).map(d => d.key)

export type ProfileData = {
  user: {
    id: string
    name: string | null
    email: string
    role: string
    complianceStatus: string | null
    phone: string | null
    skills: string[]
    rating: number | null
  }
  documents: {
    docType: string
    status: DocStatus
    expiresAt: string | null
    reviewNote: string | null
  }[]
}

const DOC_STATUS_CONFIG: Record<DocStatus, {
  border: string; bg: string; icon: React.FC<{ className?: string }>; color: string; label: string
}> = {
  APPROVED: { border: 'border-emerald-200', bg: 'bg-emerald-50/50', icon: CheckCircle2, color: 'text-emerald-500', label: 'Approved'  },
  REJECTED: { border: 'border-rose-200',    bg: 'bg-rose-50/50',    icon: XCircle,      color: 'text-rose-500',   label: 'Rejected'  },
  EXPIRED:  { border: 'border-amber-200',   bg: 'bg-amber-50/50',   icon: AlertCircle,  color: 'text-amber-500',  label: 'Expired'   },
  PENDING:  { border: 'border-blue-200',    bg: 'bg-blue-50/50',    icon: Clock,        color: 'text-blue-500',   label: 'In Review' },
  MISSING:  { border: 'border-surface-3',   bg: 'bg-white',         icon: FileText,     color: 'text-ink/30',     label: 'Missing'   },
}

const inputCls = 'h-11 w-full rounded-xl border border-surface-3 bg-surface-1 px-4 text-sm text-ink placeholder:text-ink/30 transition-all duration-150 focus:border-teal focus:bg-white focus:shadow-focus focus:outline-none'
const labelCls = 'block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5'

export default function ProfileClient({ initialData }: { initialData: ProfileData }) {
  const router        = useRouter()
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState<string | null>(null)
  const [message, setMessage]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRefs      = useRef<Record<string, HTMLInputElement | null>>({})

  const { user, documents } = initialData
  const docMap = Object.fromEntries(documents.map(d => [d.docType, d]))

  const approvedRequired = REQUIRED_KEYS.filter(k => docMap[k]?.status === 'APPROVED').length
  const progressPct = Math.round((approvedRequired / REQUIRED_KEYS.length) * 100)
  const isCompliant = user.complianceStatus === 'GREEN'

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res  = await fetch('/api/profile', { method: 'POST', body: new FormData(e.currentTarget) })
      const json = await res.json() as { ok?: boolean; error?: string }
      setMessage(json.ok
        ? { type: 'success', text: 'Profile updated.' }
        : { type: 'error',   text: json.error ?? 'Failed to update.' }
      )
      if (json.ok) router.refresh()
    } catch {
      setMessage({ type: 'error', text: 'Network error.' })
    }
    setSaving(false)
  }

  async function handleDocUpload(docType: string) {
    const input = fileRefs.current[docType]
    if (!input?.files?.length) return
    setUploading(docType)
    setMessage(null)
    const fd = new FormData()
    fd.set('file', input.files[0])
    fd.set('docType', docType)
    try {
      const res  = await fetch('/api/upload-document', { method: 'POST', body: fd })
      const json = await res.json() as { ok?: boolean; error?: string }
      const label = DOC_TYPES.find(d => d.key === docType)?.label ?? docType
      setMessage(json.ok
        ? { type: 'success', text: `${label} uploaded. Awaiting review.` }
        : { type: 'error',   text: json.error ?? 'Upload failed.' }
      )
      if (json.ok) router.refresh()
    } catch {
      setMessage({ type: 'error', text: 'Network error during upload.' })
    }
    setUploading(null)
    if (input) input.value = ''
  }

  return (
    <main className="flex-1 px-4 py-5 pb-28 space-y-5">

      {/* Toast */}
      {message && (
        <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm animate-fade-in ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Compliance progress card */}
      <div className={`bg-white rounded-2xl border shadow-card p-5 ${isCompliant ? 'border-emerald-200' : 'border-surface-2'}`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCompliant ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              <Shield className={`w-5 h-5 ${isCompliant ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className={`font-bold text-sm ${isCompliant ? 'text-emerald-800' : 'text-ink'}`}>
                {isCompliant ? 'Fully Compliant' : 'Documents Required'}
              </p>
              <p className="text-xs text-ink/45 mt-0.5">
                {approvedRequired}/{REQUIRED_KEYS.length} required documents approved
              </p>
            </div>
          </div>
          <span className={`font-black font-mono text-lg ${isCompliant ? 'text-emerald-600' : 'text-amber-500'}`}>
            {progressPct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCompliant ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {!isCompliant && (
          <p className="text-xs text-ink/40 mt-2.5">
            Upload all required documents below. Your agency reviews within 24 hours.
          </p>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-2">
          <p className="font-bold text-ink text-sm">Personal Information</p>
        </div>
        <div className="p-5">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className={labelCls}>Email</label>
              <div className="h-11 rounded-xl border border-surface-2 bg-surface-1 px-4 flex items-center text-sm text-ink/50 cursor-default">
                {user.email}
              </div>
            </div>
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                name="name"
                type="text"
                defaultValue={user.name ?? ''}
                minLength={2}
                maxLength={100}
                required
                className={inputCls}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={user.phone ?? ''}
                maxLength={20}
                className={inputCls}
                placeholder="+61 4XX XXX XXX"
              />
            </div>
            <div>
              <label className={labelCls}>Skills <span className="text-ink/30 normal-case tracking-normal font-normal">(comma-separated)</span></label>
              <input
                name="skills"
                type="text"
                defaultValue={user.skills.join(', ')}
                className={inputCls}
                placeholder="Wound care, Medication administration"
              />
            </div>
            <Button type="submit" className="w-full h-11 font-bold" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </div>
      </div>

      {/* Compliance Documents */}
      <div className="bg-white rounded-2xl border border-surface-2 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-ink/40" />
            <p className="font-bold text-ink text-sm">Compliance Documents</p>
          </div>
          <span className="text-[11px] font-semibold text-ink/40 bg-surface-2 px-2 py-0.5 rounded-full">
            {approvedRequired}/{REQUIRED_KEYS.length} done
          </span>
        </div>

        <div className="divide-y divide-surface-1">
          {DOC_TYPES.map(doc => {
            const existing   = docMap[doc.key]
            const status: DocStatus = existing?.status ?? 'MISSING'
            const cfg        = DOC_STATUS_CONFIG[status]
            const StatusIcon = cfg.icon
            const isUploading = uploading === doc.key

            return (
              <div key={doc.key} className={`p-4 ${cfg.bg}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink text-sm leading-tight">
                        {doc.label}
                      </p>
                      {doc.required && status === 'MISSING' && (
                        <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full uppercase">
                          Required
                        </span>
                      )}
                    </div>
                    {existing?.reviewNote && (
                      <p className="text-xs text-rose-600 mt-0.5">{existing.reviewNote}</p>
                    )}
                    {existing?.expiresAt && (
                      <p className="text-xs text-ink/40 mt-0.5">
                        Expires {new Date(existing.expiresAt).toLocaleDateString('en-AU')}
                      </p>
                    )}

                    {status !== 'APPROVED' && (
                      <div className="mt-2.5">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          ref={el => { fileRefs.current[doc.key] = el }}
                          onChange={() => handleDocUpload(doc.key)}
                          className="hidden"
                          id={`file-${doc.key}`}
                          disabled={isUploading}
                        />
                        <label
                          htmlFor={`file-${doc.key}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 border-dashed transition-all cursor-pointer ${
                            isUploading
                              ? 'opacity-50 cursor-not-allowed border-surface-3 text-ink/30'
                              : 'border-teal/40 text-teal hover:bg-teal/5 hover:border-teal'
                          }`}
                        >
                          {isUploading
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                            : <><Upload className="w-3.5 h-3.5" /> {status === 'MISSING' ? 'Upload' : 'Replace'}</>}
                        </label>
                      </div>
                    )}
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase border shrink-0 ${cfg.border} ${cfg.bg} ${cfg.color.replace('text-', 'text-').replace('500', '700').replace('400', '600')}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-3.5 border-t border-surface-1">
          <p className="text-[11px] text-ink/30 text-center">
            PDF, JPG, or PNG · Max 10MB · Reviewed within 24 hours
          </p>
        </div>
      </div>
    </main>
  )
}
