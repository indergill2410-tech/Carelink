'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { AcceptShiftSchema } from '@/lib/validations'
import { notifyFacilityShiftFilled, notifyShiftAccepted } from '@/lib/notifications'
import { getComplianceStatusForDocuments } from '@/lib/compliance'
import { isShiftAllowedByAvailability } from '@/lib/availability'

/**
 * Accept an open shift. Atomic + idempotent: the conditional `updateMany`
 * guard (workerId=null, status=PENDING) makes "first accept wins" safe against
 * two carers tapping the same shift. `redirectTo` lets the home and the browse
 * feed share this action while returning the user to the right page.
 */
export async function acceptShift(formData: FormData) {
  const redirectTo = (formData.get('redirectTo') as string) || '/worker'
  const parsed = AcceptShiftSchema.safeParse({ shiftId: formData.get('shiftId') })
  if (!parsed.success) redirect(`${redirectTo}?error=Invalid+shift`)

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const result = await prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.findUnique({ where: { id: authUser.id } })
    if (!dbUser) return { error: 'user_not_found' as const }

    const documents = await tx.complianceDocument.findMany({ where: { userId: authUser.id } })
    const complianceStatus = getComplianceStatusForDocuments(dbUser.role, documents)
    if (complianceStatus !== dbUser.complianceStatus) {
      await tx.user.update({ where: { id: dbUser.id }, data: { complianceStatus } })
    }
    if (complianceStatus !== 'GREEN') return { error: 'compliance_required' as const }

    const shift = await tx.shift.findUnique({
      where: { id: parsed.data.shiftId },
      include: { facility: { select: { id: true, name: true } } },
    })
    if (!shift || shift.status !== 'PENDING' || shift.workerId !== null)
      return { error: 'shift_already_taken' as const }
    if (dbUser.role !== shift.role) return { error: 'role_mismatch' as const }
    if (!isShiftAllowedByAvailability(dbUser.availability, shift.startTime)) {
      return { error: 'availability_mismatch' as const }
    }

    const updated = await tx.shift.updateMany({
      where: { id: parsed.data.shiftId, workerId: null, status: 'PENDING' },
      data: { workerId: dbUser.id, status: 'MATCHED' },
    })
    if (updated.count === 0) return { error: 'shift_already_taken' as const }

    return {
      ok: true as const,
      facilityId: shift.facility.id,
      facilityName: shift.facility.name,
      role: shift.role,
      workerName: dbUser.name ?? dbUser.email,
      dbUser,
    }
  })

  if ('error' in result) redirect(`${redirectTo}?error=${result.error}`)

  await Promise.all([
    notifyShiftAccepted(result.dbUser.id, result.facilityName, parsed.data.shiftId),
    notifyFacilityShiftFilled(result.facilityId, result.workerName, result.role, parsed.data.shiftId),
  ])
  revalidatePath('/worker')
  revalidatePath('/worker/shifts')
  revalidatePath('/worker/my-shifts')
  revalidatePath('/dashboard')
  revalidatePath('/facility')
  redirect(`${redirectTo}?success=accepted`)
}
