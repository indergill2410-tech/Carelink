import { prisma } from './prisma'

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

export async function notifyShiftAccepted(workerId: string, facilityName: string, shiftId: string) {
  await createNotification(
    workerId,
    'Shift Confirmed',
    `You've been matched for a shift at ${facilityName}.`,
    `/worker/my-shifts`,
  )
}

export async function notifyShiftCancelled(workerId: string, facilityName: string) {
  await createNotification(
    workerId,
    'Shift Cancelled',
    `Your shift at ${facilityName} has been cancelled.`,
    `/worker/my-shifts`,
  )
}
