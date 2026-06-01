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
