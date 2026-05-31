-- Add UserStatus enum
DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add TimesheetStatus enum
DO $$ BEGIN
  CREATE TYPE "TimesheetStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'INVOICED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add status column to User
ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- Add defaultRate to Facility
ALTER TABLE public."Facility"
  ADD COLUMN IF NOT EXISTS "defaultRate" NUMERIC;

-- Create Timesheet table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."Timesheet" (
  "id"        TEXT NOT NULL,
  "shiftId"   TEXT NOT NULL,
  "clockIn"   TIMESTAMP(3),
  "clockOut"  TIMESTAMP(3),
  "status"    "TimesheetStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Timesheet_shiftId_key" UNIQUE ("shiftId"),
  CONSTRAINT "Timesheet_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES public."Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
