import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

const ALLOWED_DOC_TYPES = [
  'POLICE_CHECK',
  'WORKING_WITH_CHILDREN',
  'FIRST_AID',
  'IMMUNISATION',
  'ID_PROOF',
  'NURSING_REGISTRATION',
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const docType = formData.get('docType') as string | null
  const expiresAt = formData.get('expiresAt') as string | null

  if (!file || !docType) {
    return NextResponse.json({ error: 'Missing file or docType' }, { status: 400 })
  }

  if (!ALLOWED_DOC_TYPES.includes(docType)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${user.id}/${docType}_${randomUUID()}.${ext}`

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const storageClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      global: { headers: { origin: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000' } },
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

  const { data: urlData } = storageClient.storage
    .from('compliance-docs')
    .getPublicUrl(path)

  await prisma.complianceDocument.upsert({
    where: {
      id: `${user.id}_${docType}`,
    },
    create: {
      id: `${user.id}_${docType}`,
      userId: user.id,
      docType,
      url: urlData.publicUrl,
      status: 'PENDING',
      expiresAt: expiresAt && !isNaN(new Date(expiresAt).getTime()) ? new Date(expiresAt) : null,
    },
    update: {
      url: urlData.publicUrl,
      status: 'PENDING',
      reviewNote: null,
      expiresAt: expiresAt && !isNaN(new Date(expiresAt).getTime()) ? new Date(expiresAt) : null,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
