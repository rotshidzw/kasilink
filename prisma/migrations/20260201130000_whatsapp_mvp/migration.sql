CREATE TABLE "WhatsappLink" (
  "id" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "userId" TEXT,
  "contactId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WhatsappLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsappLink_phoneE164_key" ON "WhatsappLink"("phoneE164");
CREATE INDEX "WhatsappLink_phoneE164_idx" ON "WhatsappLink"("phoneE164");

CREATE TABLE "WhatsappMessage" (
  "id" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "messageId" TEXT,
  "text" TEXT,
  "mediaUrl" TEXT,
  "mediaType" TEXT,
  "status" TEXT,
  "rawPayload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsappMessage_phoneE164_createdAt_idx" ON "WhatsappMessage"("phoneE164", "createdAt");

ALTER TABLE "WhatsappLink"
  ADD CONSTRAINT "WhatsappLink_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsappLink"
  ADD CONSTRAINT "WhatsappLink_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "AssistedContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
