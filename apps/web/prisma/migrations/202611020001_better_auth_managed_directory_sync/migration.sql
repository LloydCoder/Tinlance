-- Add the Better Auth managedDirectorySync tables enabled by the dash plugin.
-- The guards make the migration safe for environments where these tables were
-- provisioned manually before this migration was added to version control.

CREATE TABLE IF NOT EXISTS "directorySyncConnection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "aliasKey" TEXT NOT NULL,
  "provisioningDomainId" TEXT NOT NULL,
  "activeOrganizationKey" TEXT NOT NULL,
  "connectionId" TEXT,
  "creationRequestId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "createdByActorId" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastActorId" TEXT NOT NULL,
  "ssoProviderId" TEXT,
  "ssoProviderRecordId" TEXT,
  "activeSsoProviderKey" TEXT NOT NULL,
  "serializedSsoPairing" TEXT,
  "pairingEnforced" BOOLEAN NOT NULL DEFAULT false,
  "unpairedAt" TIMESTAMP(3),
  "unpairedBy" TEXT,
  "decommissionStartedAt" TIMESTAMP(3),
  "decommissionedAt" TIMESTAMP(3),
  "lastError" TEXT,
  CONSTRAINT "directorySyncConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "directorySyncMembershipProvenance" (
  "id" TEXT NOT NULL,
  "membershipKey" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "ownership" TEXT NOT NULL,
  "provisioningDomainId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "directorySyncMembershipProvenance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_aliasKey_key"
  ON "directorySyncConnection"("aliasKey");
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_provisioningDomainId_key"
  ON "directorySyncConnection"("provisioningDomainId");
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_activeOrganizationKey_key"
  ON "directorySyncConnection"("activeOrganizationKey");
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_connectionId_key"
  ON "directorySyncConnection"("connectionId");
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_creationRequestId_key"
  ON "directorySyncConnection"("creationRequestId");
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_activeSsoProviderKey_key"
  ON "directorySyncConnection"("activeSsoProviderKey");
CREATE INDEX IF NOT EXISTS "directorySyncConnection_organizationId_idx"
  ON "directorySyncConnection"("organizationId");
CREATE INDEX IF NOT EXISTS "directorySyncConnection_ssoProviderRecordId_idx"
  ON "directorySyncConnection"("ssoProviderRecordId");

CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_membershipKey_key"
  ON "directorySyncMembershipProvenance"("membershipKey");
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_memberId_key"
  ON "directorySyncMembershipProvenance"("memberId");
CREATE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_organizationId_idx"
  ON "directorySyncMembershipProvenance"("organizationId");
CREATE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_userId_idx"
  ON "directorySyncMembershipProvenance"("userId");
CREATE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_provisioningDomainId_idx"
  ON "directorySyncMembershipProvenance"("provisioningDomainId");
