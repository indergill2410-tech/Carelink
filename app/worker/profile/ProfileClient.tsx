'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertCircle, CheckCircle2, Upload, FileText,
  Loader2, XCircle, Star,
} from 'lucide-react'

type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'MISSING'

const DOC_TYPES = [
  { key: 'POLICE_CHECK', label: 'Police Check', required: true },
  { key: 'WORKING_WITH_CHILDREN', label: 'Working With Children Check', required: true },
  { key: 'FIRST_AID', label: 'First Aid Certificate', required: true },
  { key: 'IMMUNISATION', label: 'Immunisation Record', required: true },
  { key: 'NURSING_REGISTRATION', label: 'AHPRA Registration', required: false },
  { key: 'ID_PROOF', label: 'Photo ID', required: true },
]

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

function StatusIcon({ status }: { status: DocStatus }) {
  if (status === 'APPROVED') return <CheckCircle2 className="w-4 h-4 text-green-500" />
  if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-500" />
  if (status === 'EXPIRED') return <AlertCircle className="w-4 h-4 text-amber-500" />
  if (status === 'PENDING') return <Loader2 className="w-4 h-4 text-blue-500" />
  return <FileText className="w-4 h-4 text-gray-400" />
}

function StatusBadge({ status }: { status: DocStatus }) {
  const styles: Record<DocStatus, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-amber-100 text-amber-700',
    PENDING: 'bg-blue-100 text-blue-700',
    MISSING: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${styles[status]}`}>
      {status}
    </span>
  )
}

export default function ProfileClient({ initialData }: { initialData: ProfileData }) {
  const router = useRouter()
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const { user, documents } = initialData
  const docMap = Object.fromEntries(documents.map(d => [d.docType, d]))
  const isCompliant = user.complianceStatus === 'GREEN'

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfile(true)
    setMessage(null)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/profile', { method: 'POST', body: fd })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (json.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: json.error ?? 'Failed to update.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' })
    }
    setSavingProfile(false)
  }

  async function handleDocUpload(docType: string) {
    const input = fileRefs.current[docType]
    if (!input?.files?.length) return
    setUploadingDoc(docType)
    setMessage(null)
    const fd = new FormData()
    fd.set('file', input.files[0])
    fd.set('docType', docType)
    try {
      const res = await fetch('/api/upload-document', { method: 'POST', body: fd })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (json.ok) {
        const label = DOC_TYPES.find(d => d.key === docType)?.label ?? docType
        setMessage({ type: 'success', text: `${label} uploaded. Awaiting review.` })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: json.error ?? 'Upload failed.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during upload.' })
    }
    setUploadingDoc(null)
    if (input) input.value = ''
  }

  return (
    <main className="flex-1 px-4 py-5 pb-24 space-y-5">
      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Compliance Banner */}
      <div className={`p-4 rounded-2xl flex items-start gap-3 ${isCompliant ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        {isCompliant
          ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
        <div className="flex-1">
          <p className={`font-bold text-sm ${isCompliant ? 'text-green-800' : 'text-amber-800'}`}>
            {isCompliant ? 'Fully Compliant' : 'Documents Required'}
          </p>
          <p className={`text-xs mt-0.5 ${isCompliant ? 'text-green-700' : 'text-amber-700'}`}>
            {isCompliant
              ? 'You are cleared to accept shifts. Keep your documents up to date.'
              : 'Upload all required documents below. Your agency will review within 24 hours.'}
          </p>
        </div>
        {user.rating && (
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">Rating</p>
            <p className="font-bold text-navy text-sm flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {user.rating.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</label>
              <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{user.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Role</label>
              <div className="mt-1">
                <span className="bg-navy/10 text-navy text-sm font-bold px-3 py-1 rounded-full">{user.role}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Full Name</label>
              <input
                name="name"
                type="text"
                defaultValue={user.name ?? ''}
                minLength={2}
                maxLength={100}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Phone</label>
              <input
                name="phone"
                type="tel"
                defaultValue={user.phone ?? ''}
                maxLength={20}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="+61 4XX XXX XXX"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Skills (comma-separated)</label>
              <input
                name="skills"
                type="text"
                defaultValue={user.skills.join(', ')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="Wound care, Medication administration"
              />
            </div>
            <Button type="submit" className="w-full" disabled={savingProfile}>
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Compliance Documents */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> Compliance Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DOC_TYPES.map(doc => {
            const existing = docMap[doc.key]
            const status: DocStatus = existing?.status ?? 'MISSING'
            const isUploading = uploadingDoc === doc.key

            return (
              <div
                key={doc.key}
                className={`p-3 border rounded-xl ${
                  status === 'APPROVED' ? 'border-green-200 bg-green-50/50' :
                  status === 'PENDING' ? 'border-blue-200 bg-blue-50/50' :
                  status === 'REJECTED' ? 'border-red-200 bg-red-50/50' :
                  status === 'EXPIRED' ? 'border-amber-200 bg-amber-50/50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status} />
                    <div>
                      <p className="text-sm font-semibold text-navy leading-tight">
                        {doc.label}
                        {doc.required && <span className="text-red-500 ml-1 text-xs">required</span>}
                      </p>
                      {existing?.reviewNote && (
                        <p className="text-xs text-red-600 mt-0.5">{existing.reviewNote}</p>
                      )}
                      {existing?.expiresAt && (
                        <p className="text-xs text-gray-500">
                          Expires {new Date(existing.expiresAt).toLocaleDateString('en-AU')}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {status !== 'APPROVED' && (
                  <>
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
                      className={`mt-2 flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed rounded-lg text-sm font-medium transition-colors ${
                        isUploading
                          ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                          : 'border-teal text-teal hover:bg-teal-50 cursor-pointer'
                      }`}
                    >
                      {isUploading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                        : <><Upload className="w-4 h-4" /> {status === 'MISSING' ? 'Upload Document' : 'Replace'}</>}
                    </label>
                  </>
                )}
              </div>
            )
          })}
          <p className="text-xs text-gray-400 text-center">
            PDF, JPG, or PNG · Max 10MB · Reviewed within 24 hours
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
