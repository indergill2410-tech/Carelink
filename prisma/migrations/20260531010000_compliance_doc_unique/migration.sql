-- Add unique constraint on (userId, docType) for ComplianceDocument
-- First clean up any duplicate entries keeping the most recent
DELETE FROM "ComplianceDocument" a
USING "ComplianceDocument" b
WHERE a."userId" = b."userId"
  AND a."docType" = b."docType"
  AND a."createdAt" < b."createdAt";

-- Add the unique constraint
ALTER TABLE "ComplianceDocument"
  ADD CONSTRAINT "ComplianceDocument_userId_docType_key" UNIQUE ("userId", "docType");
