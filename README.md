# Carelink

Healthcare staffing platform connecting aged care facilities with nurses, enrolled nurses, and personal care assistants.

## Architecture

- **Frontend/Backend**: Next.js 14 (App Router, React Server Components, Server Actions)
- **Database**: PostgreSQL via [Supabase](https://supabase.com)
- **ORM**: Prisma
- **Auth**: Supabase Auth with SSR
- **UI**: Tailwind CSS + Shadcn/Radix UI

### Three Portals

| Portal | Route | Role |
|---|---|---|
| Admin Dispatch | `/dashboard` | `ADMIN` — global shift overview |
| Facility Portal | `/facility` | `ADMIN` — facility-scoped shift requests |
| Worker App | `/worker` | `NURSE`, `EN`, `PCA` — mobile shift feed |

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- npm

## Setup

### 1. Install dependencies

```bash
npm install
