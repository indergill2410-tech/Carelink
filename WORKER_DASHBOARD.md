# CareLink — Worker Dashboard Build Tracker

Living record of the worker (carer) side build. Updated each phase.

## Decisions

- **Schema strategy**: extend existing Prisma models (`User`, `Notification`, `Shift`, `ComplianceDocument`, `ShiftRating`) and add new models only where there's no equivalent (`ShiftAssignment`, `WorkerEarnings`, `PreferredWorker`). We do **not** create parallel `worker_profiles` / `worker_credentials` tables — that would orphan live data and break the facility dashboard.
- **Palette** (whole app): warm amber `#D97706` primary, **sage `#7C8B5E`** secondary, **clay/dusty-rose `#B06E62`** tertiary — all pulled from the hero photo (amber scrubs · sage plants · rose cardigan). Roles: RN amber · EN sage · PCA clay. Warm neutrals only (cream→stone surfaces, ink text); no cool blue/slate anywhere. Status green/amber/red kept as functional signals. Tokens live in `tailwind.config.js`.
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

### Phase 2 — Shift engine
- [x] `/worker/schedule` — agenda/calendar of confirmed shifts + Google Calendar export
- [x] `/worker/notifications` — dedicated feed (today/earlier groups, mark-all-read)
- [ ] `ShiftAssignment` model + OFFERED/expiry lifecycle — **deferred** (would replace the working pull-based booking flow; needs live-schema + flow change)
- [ ] `match-shift` Edge Function — **deferred** (depends on ShiftAssignment + Edge Function deploy)
- [ ] PIN check-in — **deferred** (current time-window clock-in works; PIN needs an additive `Shift.checkInPin` column)
- [ ] Notifications Realtime subscription — **deferred** (page polls on load; Realtime is an enhancement)

### Phase 3 — Trust & retention
- [x] `/worker/credentials` — compliance centre with RAG status + progress
- [x] Earnings: projected-monthly from confirmed shifts + ATO CSV export (on `/worker/pay`)
- [ ] Credential expiry scheduled jobs (60/30/7d emails) — **deferred** (needs a cron/Edge Function)
- [ ] `WorkerEarnings` persisted table — **deferred** (earnings computed live via pay-engine; table only needed for Stripe payouts)
- [ ] `PreferredWorker` + badge — **deferred** (additive table; facility-side rating prompt out of worker scope)
- [x] `/worker/profile` — already polished (existing)

### Phase 4 — $1B features (all deferred — external infra)
- [ ] Stripe Connect payouts · Push notifications (OneSignal/FCM) · AHPRA register API · availability intelligence · gamified analytics

## Demo data (all 3 worker accounts wired to live data)

`prisma/seed-demo-workers.sql` — idempotent. Gives nurse@/en@/pca@ each:
- All compliance docs APPROVED → **GREEN** (nurse First Aid expires in 28 days to demo the 60-day credential alert)
- Completed shifts this week + last week → **earnings widget + stats**
- A confirmed shift **today** → today's-shift card with check-in
- Upcoming confirmed shifts → **coming up**
- Open role-matched offers (some urgent) → **new offers**
- Manager ratings → **rating_avg 4.7**

Re-run any time: `psql "$DIRECT_URL" -f prisma/seed-demo-workers.sql` (or Supabase SQL editor). Applied to live DB `ansojajzpnkbrcqoeile` on 2026-06-24.

## Env vars needed
None new yet. (Existing: `RESEND_API_KEY`, `FROM_EMAIL`, Supabase keys, `DATABASE_URL`/`DIRECT_URL`.)

## Manual setup pending
- Storage bucket `compliance-docs` already exists. No new buckets yet.
- Edge Functions / scheduled jobs: none deployed yet (Phase 2+).
