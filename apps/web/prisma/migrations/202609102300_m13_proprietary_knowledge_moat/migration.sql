-- M13: governed, privacy-preserving proprietary intelligence.
-- Raw engagement content is intentionally NOT copied into these tables.
CREATE TABLE "IntelligenceSource" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "provenance" JSONB NOT NULL,
  "classification" TEXT NOT NULL,
  "contractualBasis" TEXT,
  "permittedPurpose" TEXT,
  "allowedAudience" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "allowedDestinations" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "retentionUntil" TIMESTAMP(3),
  "customerApprovalRequired" BOOLEAN NOT NULL DEFAULT TRUE,
  "commercialReuseAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
  "aggregationAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" TEXT NOT NULL DEFAULT 'REQUIRES_REVIEW',
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligenceSource_org_status_idx" ON "IntelligenceSource"("organizationId","status");
CREATE INDEX "IntelligenceSource_engagement_idx" ON "IntelligenceSource"("engagementId");

CREATE TABLE "IntelligenceCandidate" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL REFERENCES "IntelligenceSource"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "category" TEXT NOT NULL,
  "minimizedContent" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
  "riskLevel" TEXT NOT NULL DEFAULT 'CRITICAL',
  "riskScore" INTEGER NOT NULL DEFAULT 100,
  "riskFactors" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "evidenceCount" INTEGER NOT NULL DEFAULT 0,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "observationType" TEXT NOT NULL DEFAULT 'OBSERVED',
  "extractionVersion" TEXT NOT NULL DEFAULT 'deterministic-m13-v1',
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("organizationId","sourceId","contentHash","version")
);
CREATE INDEX "IntelligenceCandidate_org_status_idx" ON "IntelligenceCandidate"("organizationId","status");
CREATE INDEX "IntelligenceCandidate_source_idx" ON "IntelligenceCandidate"("sourceId");
CREATE INDEX "IntelligenceCandidate_risk_idx" ON "IntelligenceCandidate"("riskLevel","riskScore");

CREATE TABLE "IntelligenceEvidence" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL REFERENCES "IntelligenceCandidate"("id") ON DELETE CASCADE,
  "sourceReference" TEXT NOT NULL,
  "evidenceHash" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "provenance" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligenceEvidence_candidate_idx" ON "IntelligenceEvidence"("candidateId");
CREATE INDEX "IntelligenceEvidence_org_idx" ON "IntelligenceEvidence"("organizationId");

CREATE TABLE "IntelligenceApproval" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL REFERENCES "IntelligenceCandidate"("id") ON DELETE CASCADE,
  "candidateVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "transformationVersion" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "audience" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "purpose" TEXT NOT NULL,
  "destination" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "policyVersion" TEXT NOT NULL,
  "reviewerUserId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligenceApproval_candidate_idx" ON "IntelligenceApproval"("candidateId","candidateVersion");

CREATE TABLE "IntelligencePattern" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "generalizedObservation" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "maturity" TEXT NOT NULL DEFAULT 'OBSERVATION',
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "evidenceCount" INTEGER NOT NULL DEFAULT 0,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" TEXT NOT NULL DEFAULT 'HIGH',
  "observationType" TEXT NOT NULL DEFAULT 'AGGREGATED',
  "methodology" TEXT NOT NULL,
  "cohortDefinition" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "observedFrom" TIMESTAMP(3),
  "observedTo" TIMESTAMP(3),
  "lastValidatedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligencePattern_org_status_idx" ON "IntelligencePattern"("organizationId","status");
CREATE INDEX "IntelligencePattern_category_idx" ON "IntelligencePattern"("category","maturity");

CREATE TABLE "IntelligencePatternSource" (
  "patternId" TEXT NOT NULL REFERENCES "IntelligencePattern"("id") ON DELETE CASCADE,
  "candidateId" TEXT NOT NULL REFERENCES "IntelligenceCandidate"("id") ON DELETE CASCADE,
  PRIMARY KEY("patternId","candidateId")
);

CREATE TABLE "IntelligenceBenchmark" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "cohortDefinition" JSONB NOT NULL,
  "sampleSize" INTEGER NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "methodology" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "suppressed" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligenceBenchmark_org_category_idx" ON "IntelligenceBenchmark"("organizationId","category");

CREATE TABLE "IntelligencePublication" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL REFERENCES "IntelligenceCandidate"("id") ON DELETE CASCADE,
  "candidateVersion" INTEGER NOT NULL,
  "contentHash" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "visibility" TEXT NOT NULL,
  "publishedVersion" INTEGER NOT NULL,
  "approvalId" TEXT NOT NULL REFERENCES "IntelligenceApproval"("id"),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligencePublication_active_idx" ON "IntelligencePublication"("destination","visibility","revokedAt");
CREATE INDEX "IntelligencePublication_candidate_idx" ON "IntelligencePublication"("candidateId");

CREATE TABLE "IntelligenceRevocation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL REFERENCES "IntelligenceCandidate"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligenceRevocation_candidate_idx" ON "IntelligenceRevocation"("candidateId","createdAt");

CREATE TABLE "IntelligenceAccessEvent" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "actorUserId" TEXT,
  "actorType" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "decision" TEXT NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "requestId" TEXT,
  "traceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "IntelligenceAccessEvent_org_time_idx" ON "IntelligenceAccessEvent"("organizationId","createdAt");
CREATE INDEX "IntelligenceAccessEvent_resource_idx" ON "IntelligenceAccessEvent"("resourceType","resourceId");

CREATE TABLE "IntelligenceJob" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "sourceId" TEXT,
  "candidateId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "jobType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "costUnits" INTEGER NOT NULL DEFAULT 0,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("organizationId","idempotencyKey")
);
CREATE INDEX "IntelligenceJob_status_idx" ON "IntelligenceJob"("organizationId","status","createdAt");

-- Defense-in-depth: source and candidate records are never public by construction.
ALTER TABLE "IntelligenceSource" ADD CONSTRAINT "IntelligenceSource_classification_ck" CHECK ("classification" IN ('PUBLIC','INTERNAL','CUSTOMER_CONFIDENTIAL','CUSTOMER_RESTRICTED','PERSONAL_DATA','SENSITIVE_PERSONAL_DATA','SECRET','CREDENTIAL','SECURITY_SENSITIVE','LEGALLY_RESTRICTED','DERIVED_INTELLIGENCE','APPROVED_PUBLIC_INTELLIGENCE'));
ALTER TABLE "IntelligenceCandidate" ADD CONSTRAINT "IntelligenceCandidate_status_ck" CHECK ("status" IN ('CANDIDATE','ELIGIBILITY_REVIEW','MINIMIZATION_REQUIRED','DE_IDENTIFICATION','RISK_REVIEW','HUMAN_REVIEW','APPROVED_INTERNAL','APPROVED_LIMITED','APPROVED_PUBLIC','PUBLISHED','REJECTED','REVOKED','EXPIRED','SUPERSEDED','REQUIRES_REVIEW'));
ALTER TABLE "IntelligenceCandidate" ADD CONSTRAINT "IntelligenceCandidate_risk_ck" CHECK ("riskLevel" IN ('LOW','MEDIUM','HIGH','CRITICAL'));
ALTER TABLE "IntelligenceApproval" ADD CONSTRAINT "IntelligenceApproval_decision_ck" CHECK ("decision" IN ('APPROVED','REJECTED','REVOKED'));
ALTER TABLE "IntelligenceApproval" ADD CONSTRAINT "IntelligenceApproval_scope_ck" CHECK ("scope" IN ('INTERNAL','LIMITED','PUBLIC','CUSTOMER_SAFE'));
