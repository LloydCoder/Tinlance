CREATE TABLE IF NOT EXISTS "SecurityPolicy" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('DRAFT','REVIEW','APPROVED','ACTIVE','DISABLED','ARCHIVED')),
  "priority" INTEGER NOT NULL DEFAULT 100,
  "createdByUserId" TEXT,
  "approvedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SecurityPolicy_org_status_priority_idx" ON "SecurityPolicy" ("organizationId", "status", "priority");

CREATE TABLE IF NOT EXISTS "SecurityPolicyVersion" (
  "id" TEXT PRIMARY KEY,
  "policyId" TEXT NOT NULL REFERENCES "SecurityPolicy"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "definition" JSONB NOT NULL,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "approvedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityPolicyVersion_policy_version_key" UNIQUE ("policyId", "version")
);

CREATE INDEX IF NOT EXISTS "SecurityPolicyVersion_policy_effective_idx" ON "SecurityPolicyVersion" ("policyId", "effectiveFrom", "effectiveUntil");

CREATE TABLE IF NOT EXISTS "SecurityApproval" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "requestedByPrincipalId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "agentId" TEXT,
  "delegationId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "toolId" TEXT,
  "parameterHash" TEXT NOT NULL,
  "policyId" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "riskScore" INTEGER NOT NULL,
  "riskLevel" TEXT NOT NULL CHECK ("riskLevel" IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  "status" TEXT NOT NULL CHECK ("status" IN ('PENDING','APPROVED','REJECTED','CONSUMED','EXPIRED')),
  "approvedByUserId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SecurityApproval_org_status_expires_idx" ON "SecurityApproval" ("organizationId", "status", "expiresAt");
CREATE INDEX IF NOT EXISTS "SecurityApproval_binding_idx" ON "SecurityApproval" ("organizationId", "requestedByPrincipalId", "action", "resourceType", "resourceId", "parameterHash");

CREATE TABLE IF NOT EXISTS "SecurityRevocation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "principalType" TEXT NOT NULL,
  "principalId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "SecurityRevocation_active_principal_key" ON "SecurityRevocation" ("organizationId", "principalType", "principalId") WHERE "expiresAt" IS NULL;
CREATE INDEX IF NOT EXISTS "SecurityRevocation_lookup_idx" ON "SecurityRevocation" ("organizationId", "principalType", "principalId", "expiresAt");

INSERT INTO "SecurityPolicy" ("id","organizationId","name","status","priority")
VALUES ('tinlance-default-security-policy', NULL, 'Tinlance Default Security Policy', 'ACTIVE', 100)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "SecurityPolicyVersion" ("id","policyId","version","definition")
VALUES ('tinlance-default-security-policy-v1','tinlance-default-security-policy',1,'{"defaultDecision":"DENY","riskModel":"deterministic-v1","highImpactRequiresApproval":true,"criticalRequiresApproval":true,"policyFailure":"DENY"}'::jsonb)
ON CONFLICT ("policyId","version") DO NOTHING;
