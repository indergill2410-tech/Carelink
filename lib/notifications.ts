import { prisma } from './prisma'
import {
  emailWorkerShiftMatched,
  emailWorkerShiftCancelled,
  emailWorkerShiftAssigned,
  emailWorkerDocReviewed,
  emailWorkerShiftCompleted,
  emailFacilityShiftFilled,
  emailFacilityWorkerCancelledShift,
  emailFacilityShiftCompleted,
  emailAdminNewWorker,
  emailAdminDocUploaded,
} from './email'

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
) {
  await prisma.notification.create({
    data: { userId, title, body, link },
  })
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Australia/Melbourne',
  })
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Australia/Melbourne',
  })
}

function roleLabel(role: string): string {
  const map: Record<string, string> = { NURSE: 'Registered Nurse (RN)', EN: 'Enrolled Nurse (EN)', PCA: 'Personal Care Assistant (PCA)' }
  return map[role] ?? role
}

// ─── Shift accepted by worker ─────────────────────────────────────────────────

export async function notifyShiftAccepted(
  workerId: string,
  facilityName: string,
  shiftId: string,
) {
  const [worker, shift] = await Promise.all([
    prisma.user.findUnique({ where: { id: workerId }, select: { name: true, email: true } }),
    prisma.shift.findUnique({
      where: { id: shiftId },
      include: { facility: { select: { name: true, address: true, email: true } } },
    }),
  ])

  await createNotification(
    workerId,
    'Shift Confirmed',
    `You've been matched for a shift at ${facilityName}.`,
    '/worker/my-shifts',
  )

  if (worker && shift) {
    // Email worker
    await emailWorkerShiftMatched({
      workerEmail: worker.email,
      workerName: worker.name ?? 'Worker',
      facilityName: shift.facility.name,
      facilityAddress: shift.facility.address,
      role: roleLabel(shift.role),
      date: fmtDate(shift.startTime),
      startTime: fmtTime(shift.startTime),
      endTime: fmtTime(shift.endTime),
    })

    // Email facility if they have an email set
    if (shift.facility.email) {
      await emailFacilityShiftFilled({
        facilityEmail: shift.facility.email,
        facilityName: shift.facility.name,
        workerName: worker.name ?? 'A worker',
        workerRole: roleLabel(shift.role),
        date: fmtDate(shift.startTime),
        startTime: fmtTime(shift.startTime),
        endTime: fmtTime(shift.endTime),
      })
    }
  }
}

// ─── Shift cancelled (worker cancels their own booking) ───────────────────────

export async function notifyShiftCancelled(workerId: string, facilityName: string) {
  await createNotification(
    workerId,
    'Shift Cancelled',
    `Your shift at ${facilityName} has been cancelled.`,
    '/worker/my-shifts',
  )
}

export async function notifyWorkerShiftCancelledByWorker(opts: {
  workerId: string
  shiftId: string
}) {
  const [worker, shift] = await Promise.all([
    prisma.user.findUnique({ where: { id: opts.workerId }, select: { name: true, email: true } }),
    prisma.shift.findUnique({
      where: { id: opts.shiftId },
      include: { facility: { select: { name: true, address: true, email: true } } },
    }),
  ])

  if (!worker || !shift) return

  // Notify the worker
  await createNotification(
    opts.workerId,
    'Shift Cancelled',
    `You cancelled your shift at ${shift.facility.name} on ${fmtDate(shift.startTime)}.`,
    '/worker/my-shifts',
  )

  // Email worker confirmation
  await emailWorkerShiftCancelled({
    workerEmail: worker.email,
    workerName: worker.name ?? 'Worker',
    facilityName: shift.facility.name,
    date: fmtDate(shift.startTime),
  })

  // Email facility
  if (shift.facility.email) {
    await emailFacilityWorkerCancelledShift({
      facilityEmail: shift.facility.email,
      facilityName: shift.facility.name,
      workerName: worker.name ?? 'A worker',
      role: roleLabel(shift.role),
      date: fmtDate(shift.startTime),
      startTime: fmtTime(shift.startTime),
    })
  }
}

// ─── Shift assigned by admin ──────────────────────────────────────────────────

export async function notifyShiftAssigned(workerId: string, facilityName: string, shiftId: string) {
  const [worker, shift] = await Promise.all([
    prisma.user.findUnique({ where: { id: workerId }, select: { name: true, email: true } }),
    prisma.shift.findUnique({
      where: { id: shiftId },
      include: { facility: { select: { name: true, address: true, email: true } } },
    }),
  ])

  const dateStr = shift ? fmtDate(shift.startTime) : ''

  await createNotification(
    workerId,
    '📋 Shift Assigned',
    `You have been assigned a shift at ${facilityName} on ${dateStr}.`,
    '/worker/my-shifts',
  )

  if (worker && shift) {
    await emailWorkerShiftAssigned({
      workerEmail: worker.email,
      workerName: worker.name ?? 'Worker',
      facilityName: shift.facility.name,
      facilityAddress: shift.facility.address,
      role: roleLabel(shift.role),
      date: fmtDate(shift.startTime),
      startTime: fmtTime(shift.startTime),
      endTime: fmtTime(shift.endTime),
    })

    if (shift.facility.email) {
      await emailFacilityShiftFilled({
        facilityEmail: shift.facility.email,
        facilityName: shift.facility.name,
        workerName: worker.name ?? 'A worker',
        workerRole: roleLabel(shift.role),
        date: fmtDate(shift.startTime),
        startTime: fmtTime(shift.startTime),
        endTime: fmtTime(shift.endTime),
      })
    }
  }
}

// ─── Admin cancels a shift (worker was already matched) ───────────────────────

export async function notifyShiftCancelledByAdmin(shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      worker: { select: { id: true, name: true, email: true } },
      facility: { select: { name: true } },
    },
  })
  if (!shift?.worker) return

  await createNotification(
    shift.worker.id,
    'Shift Cancelled',
    `Your shift at ${shift.facility.name} on ${fmtDate(shift.startTime)} has been cancelled.`,
    '/worker/my-shifts',
  )

  await emailWorkerShiftCancelled({
    workerEmail: shift.worker.email,
    workerName: shift.worker.name ?? 'Worker',
    facilityName: shift.facility.name,
    date: fmtDate(shift.startTime),
    reason: 'Cancelled by facility management',
  })
}

// ─── Shift completed (worker clocks out) ─────────────────────────────────────

export async function notifyShiftCompleted(shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      worker: { select: { id: true, name: true, email: true } },
      facility: { select: { name: true, email: true } },
    },
  })
  if (!shift) return

  const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / 3_600_000

  if (shift.worker) {
    await createNotification(
      shift.worker.id,
      'Shift Complete',
      `Your shift at ${shift.facility.name} has been completed. Earnings added to your pay summary.`,
      '/worker/pay',
    )
    await emailWorkerShiftCompleted({
      workerEmail: shift.worker.email,
      workerName: shift.worker.name ?? 'Worker',
      facilityName: shift.facility.name,
      date: fmtDate(shift.startTime),
      hours,
    })
  }

  if (shift.facility.email) {
    await emailFacilityShiftCompleted({
      facilityEmail: shift.facility.email,
      facilityName: shift.facility.name,
      workerName: shift.worker?.name ?? 'Worker',
      role: roleLabel(shift.role),
      date: fmtDate(shift.startTime),
      hours,
    })
  }
}

// ─── Document reviewed by admin ───────────────────────────────────────────────

export async function notifyDocReviewed(opts: {
  userId: string
  docType: string
  status: 'APPROVED' | 'REJECTED'
  reviewNote?: string | null
  isNowCompliant: boolean
}) {
  const worker = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { name: true, email: true },
  })
  if (!worker) return

  const docLabel = opts.docType.replace(/_/g, ' ')
  const approved = opts.status === 'APPROVED'

  await createNotification(
    opts.userId,
    approved
      ? opts.isNowCompliant ? '✅ Fully Compliant!' : '✅ Document Approved'
      : '⚠️ Document Rejected',
    approved
      ? opts.isNowCompliant
        ? 'All required documents approved. You can now accept shifts.'
        : `Your ${docLabel} has been approved.`
      : opts.reviewNote
        ? `${docLabel}: ${opts.reviewNote}`
        : `Your ${docLabel} was rejected. Please re-upload.`,
    '/worker/profile',
  )

  await emailWorkerDocReviewed({
    workerEmail: worker.email,
    workerName: worker.name ?? 'Worker',
    docType: opts.docType,
    status: opts.status,
    reviewNote: opts.reviewNote,
    isNowCompliant: opts.isNowCompliant,
  })
}

// ─── New worker signed up ─────────────────────────────────────────────────────

export async function notifyAdminNewWorker(opts: {
  workerName: string
  workerEmail: string
  workerRole: string
}) {
  await emailAdminNewWorker(opts)
}

// ─── Worker uploaded a compliance doc ────────────────────────────────────────

export async function notifyAdminDocUploaded(opts: {
  workerName: string
  workerEmail: string
  docType: string
}) {
  await emailAdminDocUploaded(opts)
}
