-- ServiceRequest columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ServiceRequest'
  ) THEN
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
      ADD COLUMN IF NOT EXISTS "updatedById" TEXT,
      ADD COLUMN IF NOT EXISTS "contactId" TEXT;

    ALTER TABLE "ServiceRequest"
      ALTER COLUMN "status" SET DEFAULT 'DRAFT';

    UPDATE "ServiceRequest"
    SET "status" = 'DRAFT'
    WHERE "status" IS NULL;

    BEGIN
      ALTER TABLE "ServiceRequest"
        ADD CONSTRAINT "ServiceRequest_assignedDriverId_fkey"
        FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TABLE "ServiceRequest"
        ADD CONSTRAINT "ServiceRequest_assignedBusinessId_fkey"
        FOREIGN KEY ("assignedBusinessId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TABLE "ServiceRequest"
        ADD CONSTRAINT "ServiceRequest_updatedById_fkey"
        FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Assisted contacts
CREATE TABLE IF NOT EXISTS "AssistedContact" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "addressNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT,

  CONSTRAINT "AssistedContact_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "AssistedContact"
    ADD CONSTRAINT "AssistedContact_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ServiceRequest'
  ) THEN
    BEGIN
      ALTER TABLE "ServiceRequest"
        ADD CONSTRAINT "ServiceRequest_contactId_fkey"
        FOREIGN KEY ("contactId") REFERENCES "AssistedContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Announcements author
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Announcement'
      AND column_name = 'authorId'
  ) THEN
    ALTER TABLE "Announcement" ADD COLUMN "authorId" TEXT;
  END IF;
END $$;

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
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Announcement_authorId_fkey'
  ) THEN
    ALTER TABLE "Announcement"
      ADD CONSTRAINT "Announcement_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
