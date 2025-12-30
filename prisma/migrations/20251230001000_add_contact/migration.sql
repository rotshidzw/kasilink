-- Create AssistedContact table
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

-- Add contactId to ServiceRequest
ALTER TABLE "ServiceRequest"
  ADD COLUMN IF NOT EXISTS "contactId" TEXT;

DO $$
BEGIN
  ALTER TABLE "ServiceRequest"
    ADD CONSTRAINT "ServiceRequest_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "AssistedContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
