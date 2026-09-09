-- M9 reuses the existing M6 McpAgent identity and McpApproval control plane.
-- Runtime-specific state is additive and tenant-bound; no second identity or approval authority is created.

CREATE TABLE "AgentVersion" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "instructions" TEXT NOT NULL,
  "modelProvider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "configuration" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "capabilities" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "memoryPolicy" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "executionPolicy" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "riskPolicy" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "configurationHash" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentVersion_agent_fkey" FOREIGN KEY ("agentId") REFERENCES "McpAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentVersion_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentVersion_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AgentVersion_agent_org_unique" UNIQUE ("agentId","version")
);
CREATE INDEX "AgentVersion_org_agent_status_idx" ON "AgentVersion"("organizationId","agentId","status");

CREATE TABLE "AgentExecution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "agentVersionId" TEXT NOT NULL,
  "principalId" TEXT NOT NULL,
  "principalType" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "task" TEXT NOT NULL,
  "state" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "budget" JSONB NOT NULL,
  "usage" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "waitingApprovalId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentExecution_version_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "AgentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AgentExecution_agent_fkey" FOREIGN KEY ("agentId") REFERENCES "McpAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AgentExecution_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentExecution_idempotency_unique" UNIQUE ("organizationId","agentId","idempotencyKey")
);
CREATE INDEX "AgentExecution_org_status_idx" ON "AgentExecution"("organizationId","status");
CREATE INDEX "AgentExecution_agent_created_idx" ON "AgentExecution"("agentId","createdAt");
CREATE INDEX "AgentExecution_expires_idx" ON "AgentExecution"("expiresAt");

CREATE TABLE "AgentExecutionStep" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "stepType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "toolId" TEXT,
  "action" TEXT,
  "resourceId" TEXT,
  "fingerprint" TEXT,
  "m7Decision" TEXT,
  "m7PolicyId" TEXT,
  "m7PolicyVersion" TEXT,
  "approvalId" TEXT,
  "inputHash" TEXT,
  "outputHash" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AgentExecutionStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentExecutionStep_execution_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentExecutionStep_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentExecutionStep_unique" UNIQUE ("executionId","stepNumber")
);
CREATE INDEX "AgentExecutionStep_org_execution_idx" ON "AgentExecutionStep"("organizationId","executionId");
CREATE INDEX "AgentExecutionStep_fingerprint_idx" ON "AgentExecutionStep"("executionId","fingerprint");

CREATE TABLE "AgentMemory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "executionId" TEXT,
  "scope" TEXT NOT NULL,
  "subjectId" TEXT,
  "classification" TEXT NOT NULL DEFAULT 'INTERNAL',
  "trust" TEXT NOT NULL DEFAULT 'UNTRUSTED',
  "content" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "provenance" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "version" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentMemory_agent_fkey" FOREIGN KEY ("agentId") REFERENCES "McpAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentMemory_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentMemory_execution_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AgentMemory_org_agent_scope_idx" ON "AgentMemory"("organizationId","agentId","scope");
CREATE INDEX "AgentMemory_subject_idx" ON "AgentMemory"("organizationId","subjectId");
CREATE INDEX "AgentMemory_expiry_idx" ON "AgentMemory"("expiresAt");

-- Existing MCP approvals become the shared approval primitive for M6 and M9.
ALTER TABLE "McpApproval" ADD COLUMN "agentVersionId" TEXT;
ALTER TABLE "McpApproval" ADD COLUMN "requestingPrincipalId" TEXT;
ALTER TABLE "McpApproval" ADD COLUMN "riskLevel" TEXT;
ALTER TABLE "McpApproval" ADD COLUMN "policyVersion" TEXT;
ALTER TABLE "McpApproval" ADD COLUMN "parameterDigest" TEXT;
ALTER TABLE "McpApproval" ADD COLUMN "invalidatedAt" TIMESTAMP(3);
ALTER TABLE "McpApproval" ADD CONSTRAINT "McpApproval_agent_version_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "AgentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "McpApproval_runtime_lookup_idx" ON "McpApproval"("organizationId","agentId","agentVersionId","status","expiresAt");

-- Agent identity gains explicit runtime lifecycle semantics while remaining M6-owned identity.
ALTER TABLE "McpAgent" ADD COLUMN "runtimeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "McpAgent" ADD COLUMN "runtimeExpiresAt" TIMESTAMP(3);
CREATE INDEX "McpAgent_runtime_idx" ON "McpAgent"("organizationId","runtimeEnabled","status");
