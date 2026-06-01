import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailReadiness } from '@/lib/service-readiness'

export const dynamic = 'force-dynamic'

export async function GET() {
  const services = {
    email: getEmailReadiness(),
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', db: 'connected', services })
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable', services }, { status: 503 })
  }
}
