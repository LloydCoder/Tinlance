-- Sprint F platform maturity: payments, entitlements, onboarding, provisioning, outbox, proposal acceptance provenance.
-- Financial state is kept separate from provisioning and entitlement state.

ALTER TABLE "Proposal"
  ADD COLUMN IF NOT EXISTS "acceptedVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "acceptedVersionHash" TEXT;

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerReference" TEXT NOT NULL,
  "providerTransactionId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "amountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "succeededAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_amount_positive" CHECK ("amountMinor" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_provider_providerReference_key" ON "Payment"("provider", "providerReference");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_status_idx" ON "Payment"("invoiceId", "status");
CREATE INDEX IF NOT EXISTS "Payment_organizationId_createdAt_idx" ON "Payment"("organizationId", "createdAt");

CREATE TABLE IF NOT EXISTS "Entitlement" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "product" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "plan" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "paymentId" TEXT,
  "invoiceId" TEXT,
  "proposalId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effectiveUntil" TIMESTAMP(3),
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Entitlement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Entitlement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Entitlement_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Entitlement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Entitlement_quantity_positive" CHECK ("quantity" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "Entitlement_idempotencyKey_key" ON "Entitlement"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Entitlement_organizationId_capability_status_idx" ON "Entitlement"("organizationId", "capability", "status");
CREATE INDEX IF NOT EXISTS "Entitlement_sourceType_sourceId_idx" ON "Entitlement"("sourceType", "sourceId");

CREATE TABLE IF NOT EXISTS "Onboarding" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "engagementId" TEXT,
  "entitlementId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "customerActionRequired" BOOLEAN NOT NULL DEFAULT false,
  "internalActionRequired" BOOLEAN NOT NULL DEFAULT false,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Onboarding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Onboarding_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Onboarding_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Onboarding_engagementId_key" ON "Onboarding"("engagementId");
CREATE UNIQUE INDEX IF NOT EXISTS "Onboarding_entitlementId_key" ON "Onboarding"("entitlementId");
CREATE INDEX IF NOT EXISTS "Onboarding_organizationId_status_idx" ON "Onboarding"("organizationId", "status");

CREATE TABLE IF NOT EXISTS "Provisioning" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "entitlementId" TEXT NOT NULL,
  "projectId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "provisioningKey" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Provisioning_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Provisioning_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Provisioning_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Provisioning_provisioningKey_key" ON "Provisioning"("provisioningKey");
CREATE INDEX IF NOT EXISTS "Provisioning_organizationId_status_idx" ON "Provisioning"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Provisioning_entitlementId_status_idx" ON "Provisioning"("entitlementId", "status");

CREATE TABLE IF NOT EXISTS "OutboxEvent" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "eventType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "OutboxEvent_idempotencyKey_key" ON "OutboxEvent"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");
CREATE INDEX IF NOT EXISTS "OutboxEvent_organizationId_createdAt_idx" ON "OutboxEvent"("organizationId", "createdAt");

-- Seed no customer/commercial records. Existing records remain untouched until a verified lifecycle event occurs.
