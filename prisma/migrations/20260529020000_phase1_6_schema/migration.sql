-- Add DocumentStatus enum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- Add CLOCKED_IN to ShiftStatus enum
ALTER TYPE "ShiftStatus" ADD VALUE IF NOT EXISTS 'CLOCKED_IN';

-- Extend User table
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "availability" JSONB,
  ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Extend Facility table
ALTER TABLE "Facility"
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Extend Shift table
ALTER TABLE "Shift"
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "urgent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "clockInAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "clockOutAt" TIMESTAMP(3);

-- Create ComplianceDocument table
CREATE TABLE IF NOT EXISTS "ComplianceDocument" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "docType"    TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "status"     "DocumentStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt"  TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceDocument_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "read"      BOOLEAN NOT NULL DEFAULT false,
  "link"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ShiftRating table
CREATE TABLE IF NOT EXISTS "ShiftRating" (
  "id"        TEXT NOT NULL,
  "shiftId"   TEXT NOT NULL,
  "raterId"   TEXT NOT NULL,
  "rateeId"   TEXT NOT NULL,
  "rating"    INTEGER NOT NULL,
  "comment"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShiftRating_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShiftRating_shiftId_raterId_key" UNIQUE ("shiftId", "raterId"),
  CONSTRAINT "ShiftRating_shiftId_fkey"
    FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShiftRating_raterId_fkey"
    FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShiftRating_rateeId_fkey"
    FOREIGN KEY ("rateeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ComplianceDocument_userId_idx" ON "ComplianceDocument"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "ShiftRating_rateeId_idx" ON "ShiftRating"("rateeId");
