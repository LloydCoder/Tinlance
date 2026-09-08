CREATE TABLE "ApiCredential" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "secretHash" TEXT NOT NULL,
  "scopes" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiCredential_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApiCredential_prefix_key" ON "ApiCredential"("prefix");
CREATE UNIQUE INDEX "ApiCredential_secretHash_key" ON "ApiCredential"("secretHash");
CREATE INDEX "ApiCredential_organizationId_createdAt_idx" ON "ApiCredential"("organizationId","createdAt");
CREATE INDEX "ApiCredential_organizationId_revokedAt_idx" ON "ApiCredential"("organizationId","revokedAt");
ALTER TABLE "ApiCredential" ADD CONSTRAINT "ApiCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApiCredential" ADD CONSTRAINT "ApiCredential_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ApiIdempotencyKey" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "credentialId" TEXT,
  "key" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiIdempotencyKey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApiIdempotencyKey_credentialId_key_method_path_key" ON "ApiIdempotencyKey"("credentialId","key","method","path");
CREATE INDEX "ApiIdempotencyKey_organizationId_expiresAt_idx" ON "ApiIdempotencyKey"("organizationId","expiresAt");
ALTER TABLE "ApiIdempotencyKey" ADD CONSTRAINT "ApiIdempotencyKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApiIdempotencyKey" ADD CONSTRAINT "ApiIdempotencyKey_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "ApiCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApiEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApiEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ApiEvent_organizationId_createdAt_idx" ON "ApiEvent"("organizationId","createdAt");
CREATE INDEX "ApiEvent_organizationId_type_createdAt_idx" ON "ApiEvent"("organizationId","type","createdAt");
ALTER TABLE "ApiEvent" ADD CONSTRAINT "ApiEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApiWebhookEndpoint" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "secretHash" TEXT NOT NULL,
  "secretPrefix" TEXT NOT NULL,
  "eventTypes" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "lastDeliveredAt" TIMESTAMP(3),
  "disabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiWebhookEndpoint_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApiWebhookEndpoint_secretPrefix_key" ON "ApiWebhookEndpoint"("secretPrefix");
CREATE INDEX "ApiWebhookEndpoint_organizationId_active_idx" ON "ApiWebhookEndpoint"("organizationId","active");
ALTER TABLE "ApiWebhookEndpoint" ADD CONSTRAINT "ApiWebhookEndpoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApiWebhookDelivery" (
  "id" TEXT NOT NULL,
  "endpointId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "lastStatusCode" INTEGER,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiWebhookDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApiWebhookDelivery_endpointId_eventId_key" ON "ApiWebhookDelivery"("endpointId","eventId");
CREATE INDEX "ApiWebhookDelivery_status_nextAttemptAt_idx" ON "ApiWebhookDelivery"("status","nextAttemptAt");
ALTER TABLE "ApiWebhookDelivery" ADD CONSTRAINT "ApiWebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "ApiWebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApiWebhookDelivery" ADD CONSTRAINT "ApiWebhookDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ApiEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
