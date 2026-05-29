import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [dbUser, documents] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.complianceDocument.findMany({
      where: { userId: user.id },
      orderBy: { docType: 'asc' },
    }),
  ])

  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      complianceStatus: dbUser.complianceStatus,
      phone: dbUser.phone,
      skills: dbUser.skills,
      rating: dbUser.rating,
    },
    documents: documents.map(d => ({
      docType: d.docType,
      status: d.status,
      expiresAt: d.expiresAt?.toISOString() ?? null,
      reviewNote: d.reviewNote,
    })),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const skillsRaw = (formData.get('skills') as string)?.trim() || ''

  const validation = UpdateProfileSchema.safeParse({ name, phone, skills: skillsRaw })
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
  }

  const skills = skillsRaw
    ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20)
    : []

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone, skills },
  })

  return NextResponse.json({ ok: true })
}
