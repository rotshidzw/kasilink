-- Normalize legacy enum values before enum cast
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceRequestStatus') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'ServiceRequestStatus' AND e.enumlabel = 'SUBMITTED'
    ) THEN
      EXECUTE 'ALTER TYPE "ServiceRequestStatus" ADD VALUE ''SUBMITTED'';';
    END IF;
  END IF;
END $$;

UPDATE "ServiceRequest"
SET "status" = 'SUBMITTED'
WHERE "status"::text IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS');

-- Replace enum to remove legacy values
CREATE TYPE "ServiceRequestStatus_new" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'MATCHED',
  'ACCEPTED',
  'PICKED_UP',
  'EN_ROUTE',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED'
);

ALTER TABLE "ServiceRequest"
  ALTER COLUMN "status" TYPE "ServiceRequestStatus_new"
  USING ("status"::text::"ServiceRequestStatus_new");

ALTER TYPE "ServiceRequestStatus" RENAME TO "ServiceRequestStatus_old";
ALTER TYPE "ServiceRequestStatus_new" RENAME TO "ServiceRequestStatus";

DROP TYPE "ServiceRequestStatus_old";

ALTER TABLE "ServiceRequest"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';
