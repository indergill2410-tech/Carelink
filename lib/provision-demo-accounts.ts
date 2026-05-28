import { createHash } from 'crypto'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { prisma } from './prisma'

type DemoConfig = {
  email: string
  dbRole: 'ADMIN' | 'NURSE' | 'EN' | 'PCA'
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
  EN: {
    email: 'en@demo.carelink.app',
    dbRole: 'EN',
    name: 'Demo EN Worker',
    complianceStatus: 'AMBER',
    destination: '/worker',
  },
  PCA: {
    email: 'pca@demo.carelink.app',
    dbRole: 'PCA',
    name: 'Demo PCA Worker',
    complianceStatus: 'RED',
    destination: '/worker',
  },
}

// Fix 4: deterministic UUID from a stable seed string so createMany({ skipDuplicates })
// is truly idempotent across re-runs.
function deterministicUuid(seed: string): string {
  const hash = createHash('sha1').update('carelink-demo-' + seed).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
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

  // If both signInError and signInData.user are falsy (shouldn't happen), bail out
  if (!signInError) return null

  // Fix 1: detect transient errors (rate-limit, server error) before doing any
  // destructive deletion — only proceed for 400/401/422 credential/account errors.
  const isAccountBroken =
    signInError.status === 400 || signInError.status === 401 || signInError.status === 422
  if (!isAccountBroken) {
    console.warn('[demo] Transient sign-in error for', config.email, signInError.status, signInError.message)
    const dbUser = await prisma.user
      .findUnique({ where: { email: config.email }, select: { id: true } })
      .catch(() => null)
    return dbUser?.id ?? null
  }

  // Sign-in failed with a credential/account error — account was likely created via
  // direct SQL without auth.identities. Find existing public.User row.
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

// Fix 5: DST-aware Melbourne date — probes with UTC+10 then corrects for actual
// AEST (+10) / AEDT (+11) offset via Intl.DateTimeFormat.
function melbourneDate(dayOffset: number, hour: number, minute = 0): Date {
  const now = new Date()
  // 'sv' locale formats as 'YYYY-MM-DD' — gives today in Melbourne timezone
  const todayMelb = new Intl.DateTimeFormat('sv', { timeZone: 'Australia/Melbourne' }).format(now)
  const [y, mo, d] = todayMelb.split('-').map(Number)

  // Initial probe assuming UTC+10
  const probe = new Date(Date.UTC(y, mo - 1, d + dayOffset, hour - 10, minute))

  // Get actual Melbourne time components to detect DST offset
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Australia/Melbourne',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(probe)
  const pHour = parseInt(parts.find(p => p.type === 'hour')!.value) % 24
  const pMin = parseInt(parts.find(p => p.type === 'minute')!.value)

  // Correct for DST — normalise across midnight boundary
  let diffH = hour - pHour
  if (diffH > 12) diffH -= 24
  if (diffH < -12) diffH += 24
  const diffMs = (diffH * 60 + (minute - pMin)) * 60000

  return new Date(probe.getTime() + diffMs)
}

async function seedDemoData(facilityManagerId: string, nurseId: string, enId: string, pcaId: string) {
  try {
    // Find or create Sunrise Aged Care (Demo)
    let sunrise = await prisma.facility.findFirst({
      where: { name: 'Sunrise Aged Care (Demo)' },
    })

    if (!sunrise) {
      sunrise = await prisma.facility.create({
        data: {
          name: 'Sunrise Aged Care (Demo)',
          address: '123 Sunrise Drive, Melbourne VIC 3000',
        },
      })
    }

    // Assign Sunrise to facility manager
    await prisma.user.update({
      where: { id: facilityManagerId },
      data: { facilityId: sunrise.id },
    })

    // Find or create Oakwood Nursing Home (Demo)
    let oakwood = await prisma.facility.findFirst({
      where: { name: 'Oakwood Nursing Home (Demo)' },
    })

    if (!oakwood) {
      oakwood = await prisma.facility.create({
        data: {
          name: 'Oakwood Nursing Home (Demo)',
          address: '45 Oakwood Avenue, Richmond VIC 3121',
        },
      })
    }

    // Fix 4: deterministic IDs + skipDuplicates makes this fully idempotent
    await prisma.shift.createMany({
      skipDuplicates: true,
      data: [
        // Sunrise shifts (8 rows)

        // 1. PENDING NURSE — day+1 07:00–15:00
        {
          id: deterministicUuid('sunrise-nurse-pending-d1'),
          facilityId: sunrise.id,
          role: 'NURSE',
          status: 'PENDING',
          startTime: melbourneDate(1, 7),
          endTime: melbourneDate(1, 15),
          hourlyRate: 55,
        },
        // 2. PENDING EN — day+1 15:00–23:00
        {
          id: deterministicUuid('sunrise-en-pending-d1'),
          facilityId: sunrise.id,
          role: 'EN',
          status: 'PENDING',
          startTime: melbourneDate(1, 15),
          endTime: melbourneDate(1, 23),
          hourlyRate: 45,
        },
        // 3. PENDING PCA — day+3 07:00–15:00
        {
          id: deterministicUuid('sunrise-pca-pending-d3'),
          facilityId: sunrise.id,
          role: 'PCA',
          status: 'PENDING',
          startTime: melbourneDate(3, 7),
          endTime: melbourneDate(3, 15),
          hourlyRate: 32.5,
        },
        // 4. MATCHED NURSE — day+2 07:00–15:00
        {
          id: deterministicUuid('sunrise-nurse-matched-d2'),
          facilityId: sunrise.id,
          role: 'NURSE',
          status: 'MATCHED',
          startTime: melbourneDate(2, 7),
          endTime: melbourneDate(2, 15),
          hourlyRate: 55,
          workerId: nurseId,
        },
        // 5. MATCHED EN — day+2 15:00–23:00
        {
          id: deterministicUuid('sunrise-en-matched-d2'),
          facilityId: sunrise.id,
          role: 'EN',
          status: 'MATCHED',
          startTime: melbourneDate(2, 15),
          endTime: melbourneDate(2, 23),
          hourlyRate: 45,
          workerId: enId,
        },
        // 6. COMPLETED NURSE — day-1 07:00–15:00
        {
          id: deterministicUuid('sunrise-nurse-completed-dm1'),
          facilityId: sunrise.id,
          role: 'NURSE',
          status: 'COMPLETED',
          startTime: melbourneDate(-1, 7),
          endTime: melbourneDate(-1, 15),
          hourlyRate: 55,
          workerId: nurseId,
        },
        // 7. COMPLETED NURSE — day-3 07:00–15:00
        {
          id: deterministicUuid('sunrise-nurse-completed-dm3'),
          facilityId: sunrise.id,
          role: 'NURSE',
          status: 'COMPLETED',
          startTime: melbourneDate(-3, 7),
          endTime: melbourneDate(-3, 15),
          hourlyRate: 55,
          workerId: nurseId,
        },
        // 8. CANCELLED PCA — day-2 07:00–15:00
        {
          id: deterministicUuid('sunrise-pca-cancelled-dm2'),
          facilityId: sunrise.id,
          role: 'PCA',
          status: 'CANCELLED',
          startTime: melbourneDate(-2, 7),
          endTime: melbourneDate(-2, 15),
          hourlyRate: 32.5,
        },

        // Oakwood shifts (2 rows)

        // 9. PENDING NURSE — day+2 07:00–15:00
        {
          id: deterministicUuid('oakwood-nurse-pending-d2'),
          facilityId: oakwood.id,
          role: 'NURSE',
          status: 'PENDING',
          startTime: melbourneDate(2, 7),
          endTime: melbourneDate(2, 15),
          hourlyRate: 55,
        },
        // 10. PENDING PCA — day+4 07:00–15:00
        {
          id: deterministicUuid('oakwood-pca-pending-d4'),
          facilityId: oakwood.id,
          role: 'PCA',
          status: 'PENDING',
          startTime: melbourneDate(4, 7),
          endTime: melbourneDate(4, 15),
          hourlyRate: 32.5,
        },
      ],
    })

    console.log('[demo] Seeded demo shifts for Sunrise:', sunrise.id, 'and Oakwood:', oakwood.id)
  } catch (err) {
    console.error('[demo] Failed to seed demo data:', err)
  }
}

export async function provisionDemoAccounts(force = false): Promise<void> {
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!demoPassword || !supabaseUrl || !anonKey || !serviceRoleKey) {
    // Return early — this is a no-op in environments without demo config
    return
  }

  // Fix 2: fast-path — skip the whole provisioning pass when all accounts already
  // exist in the DB (normal case after first boot). Pass force=true to bypass.
  if (!force) {
    const emails = Object.values(DEMO_CONFIGS).map(c => c.email)
    const existingCount = await prisma.user
      .count({ where: { email: { in: emails } } })
      .catch(() => 0)
    if (existingCount === emails.length) return
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
    const enId = results['EN']
    const pcaId = results['PCA']

    if (facilityManagerId && nurseId && enId && pcaId) {
      await seedDemoData(facilityManagerId, nurseId, enId, pcaId)
    } else {
      console.error('[demo] Skipping seed — missing facilityManagerId, nurseId, enId, or pcaId', results)
    }
  } catch (err) {
    console.error('[demo] provisionDemoAccounts failed:', err)
    // Never throw — this must be non-fatal
  }
}
