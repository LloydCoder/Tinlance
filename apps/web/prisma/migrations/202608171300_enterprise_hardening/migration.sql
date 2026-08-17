-- Add idempotency keys for public lead and booking submissions.
ALTER TABLE "Lead" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Booking" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Lead_idempotencyKey_key" ON "Lead"("idempotencyKey");
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- Track whether a client message has been read.
ALTER TABLE "Message" ADD COLUMN "readAt" TIMESTAMP(3);
CREATE INDEX "Message_organizationId_readAt_idx" ON "Message"("organizationId", "readAt");
