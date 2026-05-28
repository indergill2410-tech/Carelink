-- ============================================================
-- Carelink Schema Migration
-- Run this in the Supabase SQL Editor BEFORE deploying the app.
-- Safe to re-run — all statements are idempotent.
-- ============================================================

-- 1. Create the ComplianceStatus enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "ComplianceStatus" AS ENUM ('GREEN', 'AMBER', 'RED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add facilityId column to User table (links facility admins to their facility)
ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "facilityId" TEXT;

-- 3. Add timezone column to Facility table
ALTER TABLE public."Facility"
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Australia/Melbourne';

-- 4. Convert complianceStatus from TEXT to the ComplianceStatus enum
--    First ensure all existing values are valid enum members
UPDATE public."User"
  SET "complianceStatus" = 'RED'
  WHERE "complianceStatus" NOT IN ('GREEN', 'AMBER', 'RED');

ALTER TABLE public."User"
  ALTER COLUMN "complianceStatus" TYPE "ComplianceStatus"
  USING "complianceStatus"::"ComplianceStatus";

-- 5. Set the default for complianceStatus to RED
ALTER TABLE public."User"
  ALTER COLUMN "complianceStatus" SET DEFAULT 'RED'::"ComplianceStatus";

-- 6. Add foreign key from User.facilityId -> Facility.id
DO $$ BEGIN
  ALTER TABLE public."User"
    ADD CONSTRAINT "User_facilityId_fkey"
    FOREIGN KEY ("facilityId")
    REFERENCES public."Facility"(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 7. Add partial unique index to prevent two workers accepting the same shift
CREATE UNIQUE INDEX IF NOT EXISTS "shift_single_worker_idx"
  ON public."Shift" (id)
  WHERE "workerId" IS NOT NULL;
