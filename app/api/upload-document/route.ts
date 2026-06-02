import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'
import { ALL_COMPLIANCE_DOC_TYPES, COMPLIANCE_DOCUMENTS, getComplianceStatusForDocuments } from '@/lib/compliance'
import { notifyAdminsComplianceDocumentUploaded } from '@/lib/notifications'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp'])

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = checkRateLimit(`upload-doc:${user.id}`, 10, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('docType') as string | null
  const expiresAt = formData.get('expiresAt') as string | null

  if (!file || !docType) {
    return NextResponse.json({ error: 'Missing file or docType' }, { status: 400 })
  }

  if (!ALL_COMPLIANCE_DOC_TYPES.includes(docType as (typeof ALL_COMPLIANCE_DOC_TYPES)[number])) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(fileExt)) {
    return NextResponse.json({ error: 'Invalid file type or extension. Upload PDF, JPG, PNG, or WebP.' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const ext = MIME_TO_EXT[file.type] ?? 'bin'
  const path = `${user.id}/${docType}_${randomUUID()}.${ext}`

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Document storage is not configured' }, { status: 503 })
  }

  const storageClient = createServerClient(
    supabaseUrl,
    serviceKey,
    {
      global: { headers: { origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' } },
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
    },
  )

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await storageClient.storage
    .from('compliance-docs')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Store the storage path (not a signed URL which expires) so we can generate
  // fresh signed URLs on read. compliance-docs bucket must be private.
  const expiryTs = expiresAt && !isNaN(new Date(expiresAt).getTime()) ? new Date(expiresAt) : null

  await prisma.complianceDocument.upsert({
    where: {
      userId_docType: { userId: user.id, docType },
    },
    create: {
      userId: user.id,
      docType,
      url: path,
      status: 'PENDING',
      expiresAt: expiryTs,
    },
    update: {
      url: path,
      status: 'PENDING',
      reviewNote: null,
      expiresAt: expiryTs,
      updatedAt: new Date(),
    },
  })

  const [dbUser, documents] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { role: true, name: true, email: true } }),
    prisma.complianceDocument.findMany({ where: { userId: user.id } }),
  ])
  if (dbUser) {
    await prisma.user.update({
      where: { id: user.id },
      data: { complianceStatus: getComplianceStatusForDocuments(dbUser.role, documents) },
    })
    const docLabel = COMPLIANCE_DOCUMENTS.find(doc => doc.key === docType)?.label ?? docType
    await notifyAdminsComplianceDocumentUploaded(
      dbUser.name ?? dbUser.email,
      docLabel,
      user.id,
    )
  }

  // Return a short-lived signed URL for immediate display
  const { data: signedData, error: signError } = await storageClient.storage
    .from('compliance-docs')
    .createSignedUrl(path, 3600)

  if (signError || !signedData) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true, url: signedData.signedUrl })
}
