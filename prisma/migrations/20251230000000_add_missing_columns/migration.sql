-- Add new enum values safely
DO $$
BEGIN
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'MATCHED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'PICKED_UP';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'EN_ROUTE';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'OPEN';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
  ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
END $$;

-- ServiceRequest columns
ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "assignedDriverId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedBusinessId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "priceEstimateCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "deliveryFeeCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "proofOfDeliveryUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryOtp" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedById" TEXT;

ALTER TABLE "ServiceRequest"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

UPDATE "ServiceRequest"
SET "status" = 'DRAFT'
WHERE "status" IS NULL;

DO $$
BEGIN
  ALTER TABLE "ServiceRequest"
    ADD CONSTRAINT "ServiceRequest_assignedDriverId_fkey"
    FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ServiceRequest"
    ADD CONSTRAINT "ServiceRequest_assignedBusinessId_fkey"
    FOREIGN KEY ("assignedBusinessId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ServiceRequest"
    ADD CONSTRAINT "ServiceRequest_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Announcements author
ALTER TABLE "Announcement"
  ADD COLUMN IF NOT EXISTS "authorId" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Announcement' AND column_name = 'createdById'
  ) THEN
    UPDATE "Announcement"
    SET "authorId" = "createdById"
    WHERE "authorId" IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE "Announcement"
    ADD CONSTRAINT "Announcement_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
