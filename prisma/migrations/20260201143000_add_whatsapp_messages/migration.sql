DROP TABLE IF EXISTS "WhatsappMessage";

CREATE TABLE "WhatsappMessage" (
  "id" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "from" TEXT,
  "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
  "template" TEXT,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "provider" TEXT NOT NULL DEFAULT 'stub',
  "requestId" TEXT,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsappMessage_createdAt_idx" ON "WhatsappMessage"("createdAt");
CREATE INDEX "WhatsappMessage_to_idx" ON "WhatsappMessage"("to");
CREATE INDEX "WhatsappMessage_direction_idx" ON "WhatsappMessage"("direction");

ALTER TABLE "WhatsappMessage"
  ADD CONSTRAINT "WhatsappMessage_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsappMessage"
  ADD CONSTRAINT "WhatsappMessage_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
