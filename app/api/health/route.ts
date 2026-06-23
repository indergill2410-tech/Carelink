import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getDatabaseFailure,
  getDatabaseReadiness,
  getEmailReadiness,
  getStorageReadiness,
} from '@/lib/service-readiness'

export const dynamic = 'force-dynamic'

export async function GET() {
  const database = getDatabaseReadiness()
  const services = {
    email: getEmailReadiness(),
    storage: getStorageReadiness(),
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      database: { ...database, status: 'connected' },
      services,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      db: 'unreachable',
      database: getDatabaseFailure(error),
      services,
    }, { status: 503 })
  }
}
