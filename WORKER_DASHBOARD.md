# CareLink — Worker Dashboard Build Tracker

Living record of the worker (carer) side build. Updated each phase.

## Decisions

- **Schema strategy**: extend existing Prisma models (`User`, `Notification`, `Shift`, `ComplianceDocument`, `ShiftRating`) and add new models only where there's no equivalent (`ShiftAssignment`, `WorkerEarnings`, `PreferredWorker`). We do **not** create parallel `worker_profiles` / `worker_credentials` tables — that would orphan live data and break the facility dashboard.
- **Accent colour**: warm amber `#D97706` (existing brand), per product decision — not the directive's blue. Keeps the live app cohesive.
- **Data access**: Prisma for all queries; Supabase client for auth only. Live production DB is `ansojajzpnkbrcqoeile` (6 users, 2 facilities, 10 shifts at build start).

## Existing worker surface (pre-build)

| Route | State |
|---|---|
| `/worker` | Shift feed + accept (compliance-gated) |
| `/worker/my-shifts` | Scheduled shifts, clock in/out, cancel, rating |
| `/worker/pay` | Earnings history + monthly chart |
| `/worker/profile` | Availability grid, compliance docs, bio |

## Build status

### Phase 1 — Foundation
- [x] `WORKER_DASHBOARD.md` tracker
- [x] `app/worker/_data.ts` — server-only worker data layer
- [x] `app/worker/_actions.ts` — extracted `acceptShift` server action
- [x] `app/worker/page.tsx` — rebuilt as dashboard home (earnings widget, credential alert, today's shift, new offers, coming up)
- [x] `app/worker/shifts/page.tsx` — browse/accept feed (moved from old home)
- [x] `WorkerBottomNav` — 5-tab nav (Home · Find shifts · My Shifts · Pay · Profile)
- [ ] `app/worker/layout.tsx` — desktop side rail (deferred; bottom nav covers mobile)
- [ ] `/worker/onboarding` stepper (deferred — current profile/compliance flow covers most)

### Phase 2 — Shift engine (pending)
- [ ] `ShiftAssignment` model + OFFERED/expiry lifecycle
- [ ] `match-shift` Edge Function
- [ ] `/worker/schedule` calendar
- [ ] PIN check-in
- [ ] `/worker/notifications` page (Realtime)

### Phase 3 — Trust & retention (pending)
- [ ] `/worker/credentials` centre + expiry jobs
- [ ] `WorkerEarnings` persisted table
- [ ] `PreferredWorker` + badge
- [ ] Public `/worker/profile` polish

## Env vars needed
None new yet. (Existing: `RESEND_API_KEY`, `FROM_EMAIL`, Supabase keys, `DATABASE_URL`/`DIRECT_URL`.)

## Manual setup pending
- Storage bucket `compliance-docs` already exists. No new buckets yet.
- Edge Functions / scheduled jobs: none deployed yet (Phase 2+).
