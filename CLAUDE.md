# Carelink — Claude Code Context

## Infrastructure

### Supabase Project (CARELINK ONLY)
- **Project name**: indergill2410-tech's Project
- **Project ID / ref**: `ansojajzpnkbrcqoeile`
- **URL**: `https://ansojajzpnkbrcqoeile.supabase.co`
- **Region**: ap-northeast-2 (Northeast Asia — Seoul)
- **GitHub link**: indergill2410-tech/Carelink
- **Status**: Healthy (NANO compute, t4g.nano)

> ⚠️ CRITICAL: NEVER use or reference Supabase project `ropgwnprmfisbrkqkhxd`
> (that is the fixit247/tradesman app — a completely unrelated project).
> All Supabase MCP operations for Carelink must target `ansojajzpnkbrcqoeile`.

### Render Deployment
- **URL**: `https://carelink-h1f9.onrender.com`
- **Branch**: `main` (auto-deploys on merge)

### Environment Variables (Render)
All set in Render → Carelink service → Environment. See `.env.example` for the full list.
Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`DEMO_ACCOUNT_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `DIRECT_URL`.

## Architecture

- **Framework**: Next.js 14 App Router (React Server Components, Server Actions)
- **Auth**: Supabase Auth SSR (`@supabase/ssr` 0.10.3)
- **ORM**: Prisma 5.x with singleton (`lib/prisma.ts`)
- **Key format**: `sb_publishable_` (anon) and `sb_secret_` (service role) — new Supabase format

## Key note on server-side Supabase calls

`sb_publishable_` keys enforce an allowed-hosts check against the HTTP `Origin` header.
Server-side Node.js requests don't send `Origin` by default — always inject it:

```typescript
global: { headers: { origin: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000' } }
```

This is already applied in `utils/supabase/server.ts` and `lib/provision-demo-accounts.ts`.

## Demo Accounts

| Email | Role | Portal |
|---|---|---|
| admin@demo.carelink.app | ADMIN | /dashboard |
| facility@demo.carelink.app | ADMIN | /facility |
| nurse@demo.carelink.app | NURSE | /worker |
| en@demo.carelink.app | EN | /worker |
| pca@demo.carelink.app | PCA | /worker |

Password for all: value of `DEMO_ACCOUNT_PASSWORD` env var (set in Render dashboard)

Provisioned automatically via `instrumentation.ts` on server startup.
Manual trigger: `https://carelink-h1f9.onrender.com/api/demo-provision`
Status check: `https://carelink-h1f9.onrender.com/api/demo-status`

## Development Branch

Active PR branch: `claude/vigilant-fermat-gBE9y` → merges to `main`
