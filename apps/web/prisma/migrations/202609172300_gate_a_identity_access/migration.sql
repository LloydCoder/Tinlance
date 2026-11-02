-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "directorySyncConnection_organizationId_idx" ON "directorySyncConnection"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "directorySyncConnection_ssoProviderRecordId_idx" ON "directorySyncConnection"("ssoProviderRecordId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_aliasKey_key" ON "directorySyncConnection"("aliasKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_provisioningDomainId_key" ON "directorySyncConnection"("provisioningDomainId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_activeOrganizationKey_key" ON "directorySyncConnection"("activeOrganizationKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_connectionId_key" ON "directorySyncConnection"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_creationRequestId_key" ON "directorySyncConnection"("creationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncConnection_activeSsoProviderKey_key" ON "directorySyncConnection"("activeSsoProviderKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_organizationId_idx" ON "directorySyncMembershipProvenance"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_userId_idx" ON "directorySyncMembershipProvenance"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_provisioningDomainId_idx" ON "directorySyncMembershipProvenance"("provisioningDomainId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_membershipKey_key" ON "directorySyncMembershipProvenance"("membershipKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directorySyncMembershipProvenance_memberId_key" ON "directorySyncMembershipProvenance"("memberId");

