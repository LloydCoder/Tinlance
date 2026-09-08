CREATE TABLE "McpAgent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "environment" TEXT NOT NULL DEFAULT 'production',
  "scopes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "allowedTools" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "tokenPrefix" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "McpAgent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "McpAgent_tokenPrefix_key" ON "McpAgent"("tokenPrefix");
CREATE UNIQUE INDEX "McpAgent_tokenHash_key" ON "McpAgent"("tokenHash");
CREATE UNIQUE INDEX "McpAgent_organizationId_clientId_key" ON "McpAgent"("organizationId","clientId");
CREATE INDEX "McpAgent_organizationId_status_idx" ON "McpAgent"("organizationId","status");
ALTER TABLE "McpAgent" ADD CONSTRAINT "McpAgent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpAgent" ADD CONSTRAINT "McpAgent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "McpApproval" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "toolId" TEXT NOT NULL,
  "toolVersion" TEXT NOT NULL,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "parameterHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "McpApproval_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "McpApproval_organizationId_agentId_status_idx" ON "McpApproval"("organizationId","agentId","status");
CREATE INDEX "McpApproval_expiresAt_idx" ON "McpApproval"("expiresAt");
ALTER TABLE "McpApproval" ADD CONSTRAINT "McpApproval_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpApproval" ADD CONSTRAINT "McpApproval_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "McpAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpApproval" ADD CONSTRAINT "McpApproval_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "McpApproval" ADD CONSTRAINT "McpApproval_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "AuditEvent_mcp_lookup_idx" ON "AuditEvent"("organizationId","action","createdAt");
