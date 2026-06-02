# Carelink

Healthcare staffing platform connecting aged care facilities with nurses, enrolled nurses, and personal care assistants.

## Architecture

- **Frontend/Backend**: Next.js 16 (App Router, React Server Components, Server Actions)
- **Database**: PostgreSQL via [Supabase](https://supabase.com)
- **ORM**: Prisma
- **Auth**: Supabase Auth with SSR
- **UI**: Tailwind CSS + Shadcn/Radix UI

### Three Portals

| Portal | Route | Role |
|---|---|---|
| Admin Dispatch | `/dashboard` | `ADMIN` — global shift overview |
| Facility Portal | `/facility` | `ADMIN`, `FACILITY_ADMIN` — facility-scoped shift requests |
| Worker App | `/worker` | `NURSE`, `EN`, `PCA` — mobile shift feed |

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- npm

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your project values.

```bash
cp .env.example .env
```

Required variables include:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `PORT`

Optional variables:
- `DEMO_ACCOUNT_PASSWORD`
- `ENABLE_DEMO_ACCOUNTS`
- `RESEND_API_KEY`
- `FROM_EMAIL`

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

For local development with new schema changes, you can also use:

```bash
npx prisma migrate dev
```

### 5. Start the development server

```bash
npm run dev
```

App default URL:
- [http://localhost:3000](http://localhost:3000)

## Authentication

Carelink uses Supabase Auth with SSR support. Protected routes are enforced in `proxy.ts` using role-based access control.

### Role access rules

- `ADMIN` can access `/dashboard`
- `ADMIN` and `FACILITY_ADMIN` can access `/facility`
- `NURSE`, `EN`, and `PCA` can access `/worker`

## Supabase JWT role hook

To make the user role available inside the JWT, run the SQL in `prisma/sql/role_claim_hook.sql` inside the Supabase SQL Editor.

Then register the function under:
- `Authentication`
- `Hooks`
- `Custom Access Token`

This allows middleware to read the role claim without making an extra database query.

## CI/CD

The repository includes GitHub Actions workflows for:
- Type checking, tests, and linting
- Production build validation
- Prisma migration deployment on schema changes

### Required GitHub secrets

Set these repository secrets before enabling the workflows:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_ACCOUNT_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`

### Production service environment

Render reads required environment variable names from `render.yaml`; values remain external and are never committed. Email notifications require:
- `RESEND_API_KEY`
- `FROM_EMAIL`

The public health check at `/api/health` reports non-secret readiness, including whether email is configured.

### Supabase Storage

Compliance documents use a private Supabase Storage bucket:
- Bucket: `compliance-docs`
- Maximum file size: 10MB
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`

Storage objects are written under `<userId>/<docType>_<uuid>.<ext>`. RLS policies allow workers to manage only their own folder while admins can read/manage all compliance documents. The canonical setup lives in `prisma/migrations/20260602000000_storage_compliance_bucket_policies/migration.sql`.

## Security

The app includes HTTP security headers in `next.config.js`, including:
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run test
npm run lint
```
