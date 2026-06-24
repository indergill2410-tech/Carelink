'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Role, UserStatus } from '@prisma/client'
import { fromZonedTime } from 'date-fns-tz'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from './_data'
import {
  createNotification, notifyFacilityShiftFilled, notifyShiftCancelled,
} from '@/lib/notifications'
import { getComplianceStatusForDocuments } from '@/lib/compliance'
import { isShiftAllowedByAvailability } from '@/lib/availability'
import { canCancelShift, shouldNotifyWorkerAboutCancellation } from '@/lib/shift-lifecycle'

const TZ = 'Australia/Melbourne'
const parseShiftTime = (s: string) => fromZonedTime(s, TZ)

export async function broadcastShift(formData: FormData) {
  if (!await requireAdmin()) return

  const facilityId = formData.get('facilityId') as string
  const role = formData.get('role') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const hourlyRate = parseFloat(formData.get('hourlyRate') as string)
  const notes = (formData.get('notes') as string) || null
  const urgent = formData.get('urgent') === 'on'

  const start = parseShiftTime(startTime)
  const end = parseShiftTime(endTime)

  const VALID_ROLES: string[] = ['NURSE', 'EN', 'PCA']
  if (!facilityId || !VALID_ROLES.includes(role) || isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end || isNaN(hourlyRate) || hourlyRate <= 0) {
    redirect('/dashboard?post=1&error=Invalid+shift+details')
  }

  await prisma.shift.create({
    data: { facilityId, role: role as Role, status: 'PENDING', startTime: start, endTime: end, hourlyRate, notes, urgent },
  })
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function cancelShift(formData: FormData) {
  if (!await requireAdmin()) return

  const shiftId = formData.get('shiftId') as string
  if (!shiftId) return
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { facility: { select: { name: true } } },
  })
  if (!shift) return
  if (!canCancelShift(shift.status)) return
  await prisma.shift.update({ where: { id: shiftId }, data: { status: 'CANCELLED' } })
  if (shouldNotifyWorkerAboutCancellation(shift.status, shift.workerId) && shift.workerId) {
    await notifyShiftCancelled(shift.workerId, shift.facility.name, shift.id)
  }
  revalidatePath('/dashboard')
  revalidatePath('/facility')
  revalidatePath('/worker/my-shifts')
}

export async function toggleCompliance(formData: FormData) {
  if (!await requireAdmin()) return

  const workerId = formData.get('workerId') as string
  if (!workerId) return
  await prisma.$executeRaw`
    UPDATE "User"
    SET "complianceStatus" = CASE WHEN "complianceStatus" = 'GREEN' THEN 'RED' ELSE 'GREEN' END
    WHERE id = ${workerId}
  `
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/care-team')
  revalidatePath('/dashboard/certifications')
}

export async function toggleWorkerActive(formData: FormData) {
  if (!await requireAdmin()) return

  const workerId = formData.get('workerId') as string
  if (!workerId) return
  await prisma.$executeRaw`UPDATE "User" SET "isActive" = NOT "isActive" WHERE id = ${workerId}`
  revalidatePath('/dashboard/care-team')
}

export async function updateWorkerProfile(formData: FormData) {
  if (!await requireAdmin()) return

  const workerId = formData.get('workerId') as string
  const name = ((formData.get('name') as string) || '').trim() || null
  const phone = ((formData.get('phone') as string) || '').trim() || null
  const role = formData.get('role') as string
  const status = formData.get('status') as string
  const complianceStatus = formData.get('complianceStatus') as string
  const VALID_ROLES = ['NURSE', 'EN', 'PCA'] as const
  const VALID_STATUSES = ['ACTIVE', 'PENDING', 'BLOCKED'] as const
  const VALID_COMPLIANCE = ['GREEN', 'AMBER', 'RED'] as const

  if (!workerId || !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) return
  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) return
  if (!VALID_COMPLIANCE.includes(complianceStatus as typeof VALID_COMPLIANCE[number])) return

  await prisma.user.update({
    where: { id: workerId },
    data: { name, phone, role: role as Role, status: status as UserStatus, complianceStatus },
  })

  revalidatePath('/dashboard/care-team')
  revalidatePath('/worker')
  revalidatePath('/worker/profile')
}

export async function saveFacility(formData: FormData) {
  if (!await requireAdmin()) return

  const facilityId = ((formData.get('facilityId') as string) || '').trim()
  const name = ((formData.get('name') as string) || '').trim()
  const address = ((formData.get('address') as string) || '').trim()
  const phone = ((formData.get('phone') as string) || '').trim() || null
  const email = ((formData.get('email') as string) || '').trim() || null
  const defaultRateRaw = ((formData.get('defaultRate') as string) || '').trim()
  const defaultRate = defaultRateRaw ? Number(defaultRateRaw) : null

  if (!name || !address) return
  if (defaultRate !== null && (!Number.isFinite(defaultRate) || defaultRate < 0 || defaultRate > 500)) return

  const data = { name, address, phone, email, defaultRate }
  if (facilityId) {
    await prisma.facility.update({ where: { id: facilityId }, data })
  } else {
    await prisma.facility.create({ data })
  }

  revalidatePath('/dashboard/care-homes')
  revalidatePath('/facility')
}

export async function assignFacilityManager(formData: FormData) {
  if (!await requireAdmin()) return

  const facilityId = formData.get('facilityId') as string
  const managerId = formData.get('managerId') as string
  if (!facilityId || !managerId) return

  const [facility, manager] = await Promise.all([
    prisma.facility.findUnique({ where: { id: facilityId }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: managerId }, select: { id: true, role: true } }),
  ])
  if (!facility || !manager || manager.role !== 'FACILITY_ADMIN') return

  await prisma.user.update({ where: { id: managerId }, data: { facilityId } })
  await createNotification(managerId, 'Facility Assigned', `You have been assigned to manage ${facility.name}.`, '/facility')

  revalidatePath('/dashboard/care-homes')
  revalidatePath('/facility')
}

export async function reviewDocument(formData: FormData) {
  if (!await requireAdmin()) return

  const docId = formData.get('docId') as string
  const action = formData.get('action') as 'APPROVED' | 'REJECTED'
  const reviewNote = (formData.get('reviewNote') as string) || null
  if (!docId || !['APPROVED', 'REJECTED'].includes(action)) return

  const doc = await prisma.complianceDocument.update({
    where: { id: docId },
    data: { status: action, reviewNote },
    include: { user: { select: { role: true } } },
  })
  if (doc) {
    const documents = await prisma.complianceDocument.findMany({ where: { userId: doc.userId } })
    const nextComplianceStatus = getComplianceStatusForDocuments(doc.user.role, documents)
    const isNowCompliant = nextComplianceStatus === 'GREEN'
    await prisma.user.update({ where: { id: doc.userId }, data: { complianceStatus: nextComplianceStatus } })
    const docLabel = doc.docType.replace(/_/g, ' ')
    if (action === 'APPROVED') {
      await createNotification(
        doc.userId,
        isNowCompliant ? '✅ All Clear!' : '✅ Document Approved',
        isNowCompliant ? 'All your documents are approved. You can now accept shifts.' : `Your ${docLabel} has been approved.`,
        '/worker/profile',
      )
    } else {
      await createNotification(
        doc.userId,
        '⚠️ Document Needs Attention',
        reviewNote ? `${docLabel}: ${reviewNote}` : `Your ${docLabel} needs to be re-uploaded.`,
        '/worker/profile',
      )
    }
  }
  revalidatePath('/dashboard/certifications')
  revalidatePath('/dashboard')
  revalidatePath('/worker/profile')
}

export async function assignWorker(formData: FormData) {
  if (!await requireAdmin()) return

  const shiftId = formData.get('shiftId') as string
  const workerId = formData.get('workerId') as string
  if (!shiftId || !workerId) return

  const [shift, worker] = await Promise.all([
    prisma.shift.findUnique({ where: { id: shiftId }, include: { facility: { select: { id: true, name: true } } } }),
    prisma.user.findUnique({ where: { id: workerId } }),
  ])
  if (!shift || shift.status !== 'PENDING' || !worker) return
  if (!worker.isActive || worker.complianceStatus !== 'GREEN' || worker.role !== shift.role) return
  if (!isShiftAllowedByAvailability(worker.availability, shift.startTime)) return
  await prisma.shift.update({ where: { id: shiftId }, data: { workerId, status: 'MATCHED' } })

  const dateStr = shift.startTime.toLocaleDateString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Australia/Melbourne',
  })
  await createNotification(
    workerId, '📋 Shift Confirmed',
    `You have been confirmed for a ${shift.role} shift at ${shift.facility.name} on ${dateStr}.`,
    '/worker/my-shifts',
  )
  await notifyFacilityShiftFilled(shift.facility.id, worker.name ?? worker.email, shift.role, shift.id)
  revalidatePath('/dashboard')
  revalidatePath('/facility')
  revalidatePath('/worker')
  revalidatePath('/worker/my-shifts')
}

export async function approveTimesheet(formData: FormData) {
  if (!await requireAdmin()) return

  const timesheetId = (formData.get('timesheetId') as string) || null
  const shiftId = (formData.get('shiftId') as string) || null
  if (!timesheetId && !shiftId) return

  const shiftSelect = { id: true, workerId: true, facility: { select: { name: true } } }

  const existing = timesheetId
    ? await prisma.timesheet.findUnique({ where: { id: timesheetId }, include: { shift: { select: shiftSelect } } })
    : null
  if (existing && existing.status !== 'PENDING_APPROVAL') return

  const fallbackShift = !existing && shiftId
    ? await prisma.shift.findFirst({ where: { id: shiftId, status: 'COMPLETED' }, select: { id: true, clockInAt: true, clockOutAt: true } })
    : null
  if (!existing && !fallbackShift) return

  const timesheet = existing
    ? await prisma.timesheet.update({ where: { id: existing.id }, data: { status: 'APPROVED' }, include: { shift: { select: shiftSelect } } })
    : await prisma.timesheet.upsert({
        where: { shiftId: fallbackShift!.id },
        create: { shiftId: fallbackShift!.id, status: 'APPROVED', clockIn: fallbackShift!.clockInAt, clockOut: fallbackShift!.clockOutAt },
        update: { status: 'APPROVED' },
        include: { shift: { select: shiftSelect } },
      })

  if (timesheet.shift.workerId) {
    await createNotification(
      timesheet.shift.workerId, 'Hours Approved',
      `Your hours for ${timesheet.shift.facility.name} have been approved.`,
      `/worker/pay?shift=${timesheet.shift.id}`,
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/worker/pay')
}
