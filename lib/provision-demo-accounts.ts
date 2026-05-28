import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { prisma } from './prisma'

type DemoConfig = {
  email: string
  dbRole: 'ADMIN' | 'NURSE'
  name: string
  complianceStatus: string
  destination: string
}

const DEMO_CONFIGS: Record<string, DemoConfig> = {
  ADMIN: {
    email: 'admin@demo.carelink.app',
    dbRole: 'ADMIN',
    name: 'Demo Admin',
    complianceStatus: 'GREEN',
    destination: '/dashboard',
  },
  FACILITY: {
    email: 'facility@demo.carelink.app',
    dbRole: 'ADMIN',
    name: 'Demo Facility Manager',
    complianceStatus: 'GREEN',
    destination: '/facility',
  },
  NURSE: {
    email: 'nurse@demo.carelink.app',
    dbRole: 'NURSE',
    name: 'Demo Nurse',
    complianceStatus: 'GREEN',
    destination: '/worker',
  },
}

async function ensureAccount(
  config: DemoConfig,
  demoPassword: string,
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string,
): Promise<string | null> {
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Try signing in with a temporary in-memory anon client (no cookies, no persistSession)
  const anonClient = createAnonClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })

  if (!signInError && signInData?.user) {
    // Sign-in succeeded — sign out and sync the public.User role/name
    await anonClient.auth.signOut()
    const userId = signInData.user.id
    try {
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: config.email,
          name: config.name,
          role: config.dbRole,
          complianceStatus: config.complianceStatus,
        },
        update: {
          role: config.dbRole,
          name: config.name,
          complianceStatus: config.complianceStatus,
        },
      })
    } catch (err) {
      console.error('[demo] Failed to sync public.User for', config.email, err)
    }
    return userId
  }

  // Sign-in failed — account was likely created via direct SQL without auth.identities
  // Find existing public.User row
  let existingId: string | null = null
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: config.email },
      select: { id: true },
    })
    existingId = dbUser?.id ?? null
  } catch {
    // proceed to create
  }

  if (existingId) {
    // Nullify any Shift.workerId FKs pointing to this user
    try {
      await prisma.shift.updateMany({
        where: { workerId: existingId },
        data: { workerId: null },
      })
    } catch {
      // best-effort
    }

    // Delete public.User row
    try {
      await prisma.user.delete({ where: { id: existingId } })
    } catch (err) {
      console.error('[demo] Failed to delete public.User for', config.email, err)
    }

    // Delete auth user via admin API
    try {
      await adminClient.auth.admin.deleteUser(existingId)
    } catch {
      // best-effort
    }
  }

  // Recreate via admin API (properly sets up auth.identities)
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: config.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { name: config.name },
  })

  if (createError || !created?.user) {
    console.error('[demo] Failed to create auth user for', config.email, createError?.message)
    return null
  }

  const userId = created.user.id

  // Upsert public.User with correct role/name/complianceStatus
  try {
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: config.email,
        name: config.name,
        role: config.dbRole,
        complianceStatus: config.complianceStatus,
      },
      update: {
        role: config.dbRole,
        name: config.name,
        complianceStatus: config.complianceStatus,
      },
    })
  } catch (err) {
    console.error('[demo] Failed to upsert public.User for', config.email, err)
    return null
  }

  return userId
}

async function seedDemoData(facilityManagerId: string, nurseId: string) {
  try {
    // Get or create the demo facility
    let facility = await prisma.facility.findFirst({
      where: { name: 'Sunrise Aged Care (Demo)' },
    })

    if (!facility) {
      facility = await prisma.facility.create({
        data: {
          name: 'Sunrise Aged Care (Demo)',
          address: '123 Sunrise Drive, Melbourne VIC 3000',
        },
      })
    }

    // Assign facility to facility manager
    await prisma.user.update({
      where: { id: facilityManagerId },
      data: { facilityId: facility.id },
    })

    // Skip if the facility already has shifts
    const existingShiftCount = await prisma.shift.count({
      where: { facilityId: facility.id },
    })

    if (existingShiftCount > 0) {
      return
    }

    // Calculate relative dates in Melbourne timezone (+10:00)
    const now = new Date()
    const melbourneOffsetMs = 10 * 60 * 60 * 1000 // +10:00

    const melbourneDate = (dayOffset: number, hour: number, minute = 0): Date => {
      // Get today's date in Melbourne timezone
      const nowMelbourne = new Date(now.getTime() + melbourneOffsetMs)
      const year = nowMelbourne.getUTCFullYear()
      const month = nowMelbourne.getUTCMonth()
      const day = nowMelbourne.getUTCDate()
      // Construct the target date in Melbourne time, then convert to UTC
      const melbourneTime = new Date(Date.UTC(year, month, day + dayOffset, hour - 10, minute, 0))
      return melbourneTime
    }

    // Create 5 demo shifts
    await prisma.shift.createMany({
      data: [
        // PENDING NURSE — tomorrow 07:00–15:00
        {
          facilityId: facility.id,
          role: 'NURSE',
          status: 'PENDING',
          startTime: melbourneDate(1, 7),
          endTime: melbourneDate(1, 15),
          hourlyRate: 55,
        },
        // PENDING EN — day+2 07:00–15:00
        {
          facilityId: facility.id,
          role: 'EN',
          status: 'PENDING',
          startTime: melbourneDate(2, 7),
          endTime: melbourneDate(2, 15),
          hourlyRate: 45,
        },
        // PENDING PCA — day+3 07:00–15:00
        {
          facilityId: facility.id,
          role: 'PCA',
          status: 'PENDING',
          startTime: melbourneDate(3, 7),
          endTime: melbourneDate(3, 15),
          hourlyRate: 32.5,
        },
        // MATCHED NURSE (assigned to nurseId) — day+2 15:00–23:00
        {
          facilityId: facility.id,
          role: 'NURSE',
          status: 'MATCHED',
          startTime: melbourneDate(2, 15),
          endTime: melbourneDate(2, 23),
          hourlyRate: 55,
          workerId: nurseId,
        },
        // COMPLETED NURSE (assigned to nurseId) — yesterday 07:00–15:00
        {
          facilityId: facility.id,
          role: 'NURSE',
          status: 'COMPLETED',
          startTime: melbourneDate(-1, 7),
          endTime: melbourneDate(-1, 15),
          hourlyRate: 55,
          workerId: nurseId,
        },
      ],
    })

    console.log('[demo] Seeded demo shifts for facility:', facility.id)
  } catch (err) {
    console.error('[demo] Failed to seed demo data:', err)
  }
}

export async function provisionDemoAccounts(): Promise<void> {
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!demoPassword || !supabaseUrl || !anonKey || !serviceRoleKey) {
    // Return early — this is a no-op in environments without demo config
    return
  }

  try {
    const accountEntries = Object.entries(DEMO_CONFIGS)
    const results: Record<string, string | null> = {}

    for (const [roleKey, config] of accountEntries) {
      try {
        const userId = await ensureAccount(config, demoPassword, supabaseUrl, anonKey, serviceRoleKey)
        results[roleKey] = userId
        if (userId) {
          console.log('[demo] Provisioned account:', config.email, '->', userId)
        }
      } catch (err) {
        console.error('[demo] Error provisioning account for', config.email, err)
        results[roleKey] = null
      }
    }

    const facilityManagerId = results['FACILITY']
    const nurseId = results['NURSE']

    if (facilityManagerId && nurseId) {
      await seedDemoData(facilityManagerId, nurseId)
    } else {
      console.error('[demo] Skipping seed — missing facilityManagerId or nurseId', results)
    }
  } catch (err) {
    console.error('[demo] provisionDemoAccounts failed:', err)
    // Never throw — this must be non-fatal
  }
}
