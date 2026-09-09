-- M10 permissioned organizational knowledge / RAG plane.
CREATE TABLE "KnowledgeCollection" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'ORGANIZATION_PRIVATE',
  "classification" TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  "scopeType" TEXT NOT NULL DEFAULT 'ORGANIZATION',
  "projectId" TEXT,
  "assessmentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "ownerUserId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeCollection_visibility_chk" CHECK ("visibility" IN ('PUBLIC','PLATFORM_INTERNAL','ORGANIZATION_PRIVATE','TEAM_RESTRICTED','PROJECT_RESTRICTED','USER_PRIVATE')),
  CONSTRAINT "KnowledgeCollection_status_chk" CHECK ("status" IN ('ACTIVE','ARCHIVED','REVOKED')),
  CONSTRAINT "KnowledgeCollection_org_chk" CHECK ("visibility" IN ('PUBLIC','PLATFORM_INTERNAL') OR "organizationId" IS NOT NULL),
  CONSTRAINT "KnowledgeCollection_project_chk" CHECK ("scopeType" <> 'PROJECT' OR "projectId" IS NOT NULL)
);
CREATE INDEX "KnowledgeCollection_org_status_idx" ON "KnowledgeCollection" ("organizationId","status");
CREATE INDEX "KnowledgeCollection_scope_idx" ON "KnowledgeCollection" ("organizationId","scopeType","projectId","assessmentId");

CREATE TABLE "KnowledgeDocument" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "collectionId" TEXT NOT NULL REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE,
  "sourceDocumentId" TEXT,
  "title" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUARANTINED',
  "visibility" TEXT NOT NULL DEFAULT 'ORGANIZATION_PRIVATE',
  "classification" TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  "authority" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  "contentHash" TEXT,
  "currentVersionId" TEXT,
  "ownerUserId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "KnowledgeDocument_status_chk" CHECK ("status" IN ('UPLOADED','QUARANTINED','PROCESSING','INDEXING','ACTIVE','SUPERSEDED','REVOKED','DELETED','FAILED')),
  CONSTRAINT "KnowledgeDocument_authority_chk" CHECK ("authority" IN ('AUTHORITATIVE','APPROVED','INTERNAL','UNVERIFIED','EXTERNAL','QUARANTINED')),
  CONSTRAINT "KnowledgeDocument_org_chk" CHECK ("visibility" IN ('PUBLIC','PLATFORM_INTERNAL') OR "organizationId" IS NOT NULL)
);
CREATE INDEX "KnowledgeDocument_org_status_idx" ON "KnowledgeDocument" ("organizationId","status");
CREATE INDEX "KnowledgeDocument_collection_idx" ON "KnowledgeDocument" ("collectionId","status");
CREATE INDEX "KnowledgeDocument_hash_idx" ON "KnowledgeDocument" ("organizationId","contentHash");
CREATE INDEX "KnowledgeDocument_visibility_classification_idx" ON "KnowledgeDocument" ("visibility","classification","status");

CREATE TABLE "KnowledgeDocumentVersion" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "documentId" TEXT NOT NULL REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "normalizedHash" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "parserVersion" TEXT NOT NULL DEFAULT 'm10-text-1',
  "chunkerVersion" TEXT NOT NULL DEFAULT 'm10-heading-1',
  "embeddingModel" TEXT,
  "embeddingVersion" TEXT,
  "permissionVersion" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "reviewStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  "sourceUpdatedAt" TIMESTAMP(3),
  "reviewDueAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeDocumentVersion_status_chk" CHECK ("status" IN ('PROCESSING','INDEXING','ACTIVE','SUPERSEDED','REVOKED','FAILED')),
  CONSTRAINT "KnowledgeDocumentVersion_review_chk" CHECK ("reviewStatus" IN ('DRAFT','REVIEW','APPROVED')),
  UNIQUE ("documentId","version")
);
CREATE INDEX "KnowledgeDocumentVersion_org_doc_idx" ON "KnowledgeDocumentVersion" ("organizationId","documentId","version");
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_current_version_fk" FOREIGN KEY ("currentVersionId") REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE SET NULL;

CREATE TABLE "KnowledgeChunk" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "collectionId" TEXT NOT NULL REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE,
  "documentId" TEXT NOT NULL REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE,
  "documentVersionId" TEXT NOT NULL REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE CASCADE,
  "ordinal" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "location" TEXT,
  "classification" TEXT NOT NULL,
  "visibility" TEXT NOT NULL,
  "allowedRoles" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "allowedUsers" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "allowedTeams" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "projectId" TEXT,
  "assessmentId" TEXT,
  "permissionVersion" INTEGER NOT NULL,
  "authority" TEXT NOT NULL,
  "embedding" JSONB,
  "embeddingModel" TEXT,
  "embeddingVersion" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "searchVector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce("content",''))) STORED,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeChunk_status_chk" CHECK ("status" IN ('ACTIVE','REVOKED','SUPERSEDED','DELETED')),
  CONSTRAINT "KnowledgeChunk_scope_chk" CHECK ("visibility" IN ('PUBLIC','PLATFORM_INTERNAL') OR "organizationId" IS NOT NULL),
  UNIQUE ("documentVersionId","ordinal")
);
CREATE INDEX "KnowledgeChunk_search_idx" ON "KnowledgeChunk" USING GIN ("searchVector");
CREATE INDEX "KnowledgeChunk_auth_idx" ON "KnowledgeChunk" ("organizationId","visibility","classification","status");
CREATE INDEX "KnowledgeChunk_scope_idx" ON "KnowledgeChunk" ("organizationId","projectId","assessmentId","permissionVersion");

CREATE TABLE "KnowledgeAgentGrant" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE,
  "maxClassification" TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  "scope" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "expiresAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  UNIQUE ("organizationId","agentId","collectionId")
);
CREATE INDEX "KnowledgeAgentGrant_lookup_idx" ON "KnowledgeAgentGrant" ("organizationId","agentId","revokedAt","expiresAt");

CREATE TABLE "KnowledgeIngestionJob" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "documentId" TEXT NOT NULL REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE,
  "documentVersionId" TEXT NOT NULL REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE CASCADE,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("organizationId","idempotencyKey")
);
CREATE INDEX "KnowledgeIngestionJob_status_idx" ON "KnowledgeIngestionJob" ("organizationId","status","createdAt");

CREATE TABLE "KnowledgeRetrieval" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "principalId" TEXT NOT NULL,
  "principalType" TEXT NOT NULL,
  "agentId" TEXT,
  "queryHash" TEXT NOT NULL,
  "scope" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "permissionVersion" INTEGER NOT NULL DEFAULT 1,
  "candidateCount" INTEGER NOT NULL DEFAULT 0,
  "authorizedCandidateCount" INTEGER NOT NULL DEFAULT 0,
  "selectedCount" INTEGER NOT NULL DEFAULT 0,
  "method" TEXT NOT NULL DEFAULT 'LEXICAL',
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "KnowledgeRetrieval_org_created_idx" ON "KnowledgeRetrieval" ("organizationId","createdAt");

CREATE TABLE "KnowledgeCitation" (
  "id" TEXT PRIMARY KEY,
  "retrievalId" TEXT NOT NULL REFERENCES "KnowledgeRetrieval"("id") ON DELETE CASCADE,
  "chunkId" TEXT NOT NULL REFERENCES "KnowledgeChunk"("id") ON DELETE CASCADE,
  "documentId" TEXT NOT NULL REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE,
  "documentVersionId" TEXT NOT NULL REFERENCES "KnowledgeDocumentVersion"("id") ON DELETE CASCADE,
  "rank" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "location" TEXT,
  "contentHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("retrievalId","chunkId")
);
CREATE INDEX "KnowledgeCitation_retrieval_idx" ON "KnowledgeCitation" ("retrievalId","rank");

CREATE TABLE "KnowledgeAccessEvent" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "principalId" TEXT NOT NULL,
  "principalType" TEXT NOT NULL,
  "agentId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "documentVersionId" TEXT,
  "retrievalId" TEXT,
  "decision" TEXT NOT NULL,
  "reasonCode" TEXT,
  "requestId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "KnowledgeAccessEvent_org_created_idx" ON "KnowledgeAccessEvent" ("organizationId","createdAt");
CREATE INDEX "KnowledgeAccessEvent_principal_idx" ON "KnowledgeAccessEvent" ("principalId","createdAt");
