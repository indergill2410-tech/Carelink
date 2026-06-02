import { createHash } from 'crypto'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { prisma } from './prisma'

type DemoConfig = {
  email: string
  dbRole: 'ADMIN' | 'FACILITY_ADMIN' | 'NURSE' | 'EN' | 'PCA'
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
    dbRole: 'FACILITY_ADMIN',
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
  serviceRoleKey: string, // empty string = no admin API access
): Promise<string | null> {
  // sb_publishable_ keys enforce allowed-hosts against the Origin header.
  // Inject NEXT_PUBLIC_SITE_URL so server-side calls pass the check.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const clientOpts = {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { origin: siteOrigin } },
  }

  const anonClient = createAnonClient(supabaseUrl, anonKey, clientOpts)

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: config.email,
    password: demoPassword,
  })

  console.log('[demo] signIn attempt', config.email,
    signInError ? `FAILED status=${signInError.status} msg=${signInError.message}` : 'OK')

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

  // No service role key — try signUp as a fallback.
  // This works when the Supabase project has "Confirm email" disabled (common for
  // demo/internal apps). The signUp may fail with "User already registered" if the
  // account exists but is broken; we still try signIn after to cover that case.
  if (!serviceRoleKey) {
    await anonClient.auth.signUp({
      email: config.email,
      password: demoPassword,
      options: { data: { name: config.name } },
    }).catch(() => null) // ignore errors — signIn below is the real test

    const { data: autoData, error: autoErr } = await anonClient.auth.signInWithPassword({
      email: config.email,
      password: demoPassword,
    })

    if (!autoErr && autoData?.user) {
      // signOut is a no-op here: persistSession=false means the session is
      // in-memory only and calling signOut would add a needless network round-trip.
      const userId = autoData.user.id
      try {
        // Guard: if a stale DB row exists for this email but with a different ID
        // (e.g. from a prior manual insert), delete it first to avoid a P2002
        // unique constraint violation on the upsert.
        const stale = await prisma.user.findUnique({
          where: { email: config.email },
          select: { id: true },
        }).catch(() => null)
        if (stale && stale.id !== userId) {
          await prisma.shift.updateMany({ where: { workerId: stale.id }, data: { workerId: null } }).catch(() => null)
          await prisma.user.delete({ where: { id: stale.id } }).catch(() => null)
        }
        await prisma.user.upsert({
          where: { id: userId },
          create: { id: userId, email: config.email, name: config.name, role: config.dbRole, complianceStatus: config.complianceStatus },
          update: { role: config.dbRole, name: config.name, complianceStatus: config.complianceStatus },
        })
      } catch (err) {
        console.error('[demo] Failed to upsert public.User (signUp path) for', config.email, err)
      }
      return userId
    }

    console.error(
      '[demo] Cannot provision', config.email,
      '— set SUPABASE_SERVICE_ROLE_KEY, or disable "Confirm email" in your Supabase project',
      'Authentication → Email settings.',
      autoErr?.message,
    )
    return null
  }

  // Service role key is present — use admin API.
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, clientOpts)

  // Sign-in failed — find the existing auth user ID.
  // Prefer the public.User record (IDs match auth.users).
  let existingId: string | null = null
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: config.email },
      select: { id: true },
    })
    existingId = dbUser?.id ?? null
  } catch {
    // proceed
  }

  // Fast path: if the account exists, just reset the password (no delete+recreate).
  // This is much faster than the full delete+recreate cycle.
  if (existingId) {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(existingId, {
      password: demoPassword,
      email_confirm: true,
      user_metadata: { name: config.name },
      app_metadata: { role: config.dbRole },
    })

    if (!updateError) {
      console.log('[demo] Reset password for', config.email, 'via updateUserById')
      // Sync public.User role/name in case it drifted
      try {
        await prisma.user.upsert({
          where: { id: existingId },
          create: { id: existingId, email: config.email, name: config.name, role: config.dbRole, complianceStatus: config.complianceStatus },
          update: { role: config.dbRole, name: config.name, complianceStatus: config.complianceStatus },
        })
      } catch { /* best-effort */ }
      return existingId
    }

    const isUserNotFound = updateError.status === 404
    if (!isUserNotFound) {
      console.error('[demo] updateUserById failed with unexpected error for', config.email, updateError.message)
      return null
    }

    console.warn('[demo] User not found in Auth for', config.email, '— falling back to delete+recreate')

    // Update failed because user doesn't exist in Auth — do full delete+recreate
    try {
      await prisma.shift.updateMany({ where: { workerId: existingId }, data: { workerId: null } })
    } catch { /* best-effort */ }
    try { await prisma.user.delete({ where: { id: existingId } }) } catch { /* best-effort */ }
    try { await adminClient.auth.admin.deleteUser(existingId) } catch { /* best-effort */ }
  }

  // Recreate via admin API (properly sets up auth.identities)
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: config.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { name: config.name },
    app_metadata: { role: config.dbRole },
  })

  if (createError || !created?.user) {
    console.error('[demo] Failed to create auth user for', config.email,
      `status=${createError?.status} msg=${createError?.message}`)
    return null
  }
  console.log('[demo] Created auth user', config.email, '->', created.user.id)

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

// Provision a single demo account by role key (e.g. 'ADMIN', 'NURSE').
// Used by the demo-login route to avoid provisioning all 5 accounts on every fallback.
export async function provisionOneDemoAccount(roleKey: string): Promise<string | null> {
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!demoPassword || !supabaseUrl || !anonKey) return null

  const config = DEMO_CONFIGS[roleKey]
  if (!config) return null

  try {
    const userId = await ensureAccount(config, demoPassword, supabaseUrl, anonKey, serviceRoleKey ?? '')
    if (userId) {
      const requiredRoles = ['FACILITY', 'NURSE', 'EN', 'PCA']
      const emails = requiredRoles.map(r => DEMO_CONFIGS[r].email)
      const users = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true },
      })
      if (users.length === requiredRoles.length) {
        const facilityId = users.find(u => u.email === DEMO_CONFIGS['FACILITY'].email)?.id
        const nurseId    = users.find(u => u.email === DEMO_CONFIGS['NURSE'].email)?.id
        const enId       = users.find(u => u.email === DEMO_CONFIGS['EN'].email)?.id
        const pcaId      = users.find(u => u.email === DEMO_CONFIGS['PCA'].email)?.id
        if (facilityId && nurseId && enId && pcaId) {
          await seedDemoData(facilityId, nurseId, enId, pcaId)
        }
      }
    }
    return userId
  } catch (err) {
    console.error('[demo] provisionOneDemoAccount failed for', roleKey, err)
    return null
  }
}

export async function provisionDemoAccounts(force = false): Promise<void> {
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // serviceRoleKey is optional — provisioning still works via signUp fallback
  // when Supabase project has email confirmation disabled.
  if (!demoPassword || !supabaseUrl || !anonKey) {
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
        const userId = await ensureAccount(config, demoPassword, supabaseUrl, anonKey, serviceRoleKey ?? '')
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
