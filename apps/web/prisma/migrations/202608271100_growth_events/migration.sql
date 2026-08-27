CREATE TABLE "GrowthEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymousId" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "source" TEXT NOT NULL,
    "path" TEXT,
    "referrer" TEXT,
    "campaign" JSONB,
    "entityId" TEXT,
    "privacyClass" TEXT NOT NULL,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrowthEvent_eventId_key" ON "GrowthEvent"("eventId");
CREATE INDEX "GrowthEvent_eventName_occurredAt_idx" ON "GrowthEvent"("eventName", "occurredAt");
CREATE INDEX "GrowthEvent_source_occurredAt_idx" ON "GrowthEvent"("source", "occurredAt");
CREATE INDEX "GrowthEvent_organizationId_occurredAt_idx" ON "GrowthEvent"("organizationId", "occurredAt");
CREATE INDEX "GrowthEvent_userId_occurredAt_idx" ON "GrowthEvent"("userId", "occurredAt");
