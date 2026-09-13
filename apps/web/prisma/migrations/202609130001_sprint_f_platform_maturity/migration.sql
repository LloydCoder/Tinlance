-- Sprint F platform-level maturity.
-- New commercial state is additive and intentionally independent from existing M1/M3 records.

CREATE TABLE "PlatformEvidence" (
  "id" TEXT PRIMARY KEY,
  "capabilitySlug" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "repository" TEXT,
  "path" TEXT,
  "commitSha" TEXT,
  "workflow" TEXT,
  "testName" TEXT,
  "artifact" TEXT,
  "environment" TEXT,
  "result" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "limitations" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "verifiedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "PlatformEvidence_capabilitySlug_status_idx" ON "PlatformEvidence"("capabilitySlug", "status");

CREATE TABLE "PlatformClaim" (
  "id" TEXT PRIMARY KEY,
  "text" TEXT NOT NULL,
  "claimClass" TEXT NOT NULL,
  "capabilitySlug" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  "evidenceIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "sourcePaths" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "scope" TEXT NOT NULL,
  "limitations" TEXT,
  "verifiedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "critical" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "PlatformClaim_status_critical_idx" ON "PlatformClaim"("status", "critical");

CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY,
  "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE RESTRICT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "provider" TEXT NOT NULL,
  "providerReference" TEXT NOT NULL UNIQUE,
  "providerTransactionId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "amountMinor" INTEGER NOT NULL CHECK ("amountMinor" > 0),
  "currency" TEXT NOT NULL,
  "failureReason" TEXT,
  "lastProviderEventId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Payment_provider_tx_unique" UNIQUE ("provider", "providerTransactionId")
);
CREATE INDEX "Payment_invoice_status_idx" ON "Payment"("invoiceId", "status");
CREATE INDEX "Payment_organization_status_idx" ON "Payment"("organizationId", "status");

CREATE TABLE "CommercialToken" (
  "id" TEXT PRIMARY KEY,
  "kind" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "consumedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "CommercialToken_entity_idx" ON "CommercialToken"("kind", "entityId");
CREATE INDEX "CommercialToken_expiry_idx" ON "CommercialToken"("expiresAt");

CREATE TABLE "Entitlement" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "product" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "plan" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "proposalId" TEXT REFERENCES "Proposal"("id") ON DELETE RESTRICT,
  "invoiceId" TEXT REFERENCES "Invoice"("id") ON DELETE RESTRICT,
  "paymentId" TEXT REFERENCES "Payment"("id") ON DELETE RESTRICT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "quantity" INTEGER NOT NULL DEFAULT 1 CHECK ("quantity" > 0),
  "effectiveFrom" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "effectiveUntil" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Entitlement_source_unique" UNIQUE ("organizationId", "product", "capability", "sourceType", "sourceId")
);
CREATE INDEX "Entitlement_org_status_idx" ON "Entitlement"("organizationId", "status");
CREATE INDEX "Entitlement_capability_status_idx" ON "Entitlement"("capability", "status");

CREATE TABLE "Onboarding" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "engagementId" TEXT REFERENCES "Engagement"("id") ON DELETE SET NULL,
  "entitlementId" TEXT REFERENCES "Entitlement"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "checklist" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "customerActionRequired" BOOLEAN NOT NULL DEFAULT FALSE,
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Onboarding_org_status_idx" ON "Onboarding"("organizationId", "status");
CREATE INDEX "Onboarding_entitlement_idx" ON "Onboarding"("entitlementId");

CREATE TABLE "ProvisioningJob" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT,
  "entitlementId" TEXT NOT NULL REFERENCES "Entitlement"("id") ON DELETE RESTRICT,
  "product" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "ProvisioningJob_status_idx" ON "ProvisioningJob"("status", "updatedAt");
CREATE INDEX "ProvisioningJob_org_idx" ON "ProvisioningJob"("organizationId", "status");

CREATE TABLE "OutboxEvent" (
  "id" TEXT PRIMARY KEY,
  "eventKey" TEXT NOT NULL UNIQUE,
  "eventType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "organizationId" TEXT,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "processedAt" TIMESTAMPTZ,
  "lastError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "OutboxEvent_ready_idx" ON "OutboxEvent"("status", "availableAt");
CREATE INDEX "OutboxEvent_aggregate_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

CREATE TABLE "EmailDelivery" (
  "id" TEXT PRIMARY KEY,
  "eventKey" TEXT NOT NULL UNIQUE,
  "organizationId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "correlationId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'resend',
  "providerMessageId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "EmailDelivery_entity_idx" ON "EmailDelivery"("entityType", "entityId");
CREATE INDEX "EmailDelivery_status_idx" ON "EmailDelivery"("status", "updatedAt");

CREATE TABLE "ReconciliationException" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "invoiceId" TEXT,
  "paymentId" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "details" JSONB NOT NULL,
  "resolvedByUserId" TEXT,
  "resolvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "ReconciliationException_status_idx" ON "ReconciliationException"("status", "createdAt");
CREATE INDEX "ReconciliationException_invoice_idx" ON "ReconciliationException"("invoiceId", "status");

ALTER TABLE "Invoice" ADD COLUMN "paymentAccessRequired" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Invoice" ADD COLUMN "paidAt" TIMESTAMPTZ;
ALTER TABLE "Invoice" ADD COLUMN "dueAt" TIMESTAMPTZ;
CREATE UNIQUE INDEX "Invoice_externalId_unique" ON "Invoice"("externalId") WHERE "externalId" IS NOT NULL;
