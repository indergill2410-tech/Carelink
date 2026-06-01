import { prisma } from './prisma'
import { sendEmail } from './email'

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
) {
  const [notification, user] = await Promise.all([
    prisma.notification.create({
      data: { userId, title, body, link },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    }),
  ])

  if (user?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carelinkaustralia.com.au'
    const result = await sendEmail({
      to: user.email,
      subject: title,
      text: `${body}${link ? `\n\nOpen Carelink: ${siteUrl}${link}` : ''}`,
    })
    if (!result.sent) {
      console.warn('[notifications] Email not sent:', result.error)
    }
  }

  return notification
}

export async function notifyShiftAccepted(workerId: string, facilityName: string, shiftId: string) {
  await createNotification(
    workerId,
    'Shift Confirmed',
    `You've been matched for a shift at ${facilityName}.`,
    `/worker/my-shifts?shift=${shiftId}`,
  )
}

export async function notifyFacilityShiftFilled(
  facilityId: string,
  workerName: string,
  role: string,
  shiftId: string,
) {
  const managers = await prisma.user.findMany({
    where: {
      facilityId,
      role: 'FACILITY_ADMIN',
      isActive: true,
    },
    select: { id: true },
  })

  await Promise.all(managers.map(manager => createNotification(
    manager.id,
    'Shift Filled',
    `${workerName} accepted the ${role} shift.`,
    `/facility?tab=roster&shift=${shiftId}`,
  )))
}

export async function notifyShiftCancelled(workerId: string, facilityName: string, shiftId?: string) {
  await createNotification(
    workerId,
    'Shift Cancelled',
    `Your shift at ${facilityName} has been cancelled.`,
    shiftId ? `/worker/my-shifts?shift=${shiftId}` : '/worker/my-shifts',
  )
}
