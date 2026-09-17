-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN DEFAULT true,
    "failedVerificationCount" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ssoProvider" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "oidcConfig" TEXT,
    "samlConfig" TEXT,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "domain" TEXT NOT NULL,
    "domainVerified" BOOLEAN,

    CONSTRAINT "ssoProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimManagedConnection" (
    "id" TEXT NOT NULL,
    "creationRequestId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provisioningDomainId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "decommissionStartedAt" TIMESTAMP(3),
    "decommissionStartedBy" TEXT,
    "decommissionedAt" TIMESTAMP(3),
    "decommissionedBy" TEXT,

    CONSTRAINT "scimManagedConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimManagedCredential" (
    "id" TEXT NOT NULL,
    "connectionRecordId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "tokenDigest" TEXT NOT NULL,
    "hashVersion" TEXT NOT NULL,
    "activeSlotKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "serializedScopes" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "decommissionedAt" TIMESTAMP(3),

    CONSTRAINT "scimManagedCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimManagedConnectionEvent" (
    "id" TEXT NOT NULL,
    "connectionRecordId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "credentialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scimManagedConnectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimConnectionBinding" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "connectionKey" TEXT NOT NULL,
    "provisioningDomainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "decommissionedAt" TIMESTAMP(3),
    "decommissionStatus" TEXT NOT NULL DEFAULT 'active',
    "decommissionCursorUserId" TEXT,
    "decommissionReconciledUserCount" INTEGER NOT NULL DEFAULT 0,
    "decommissionBatchCount" INTEGER NOT NULL DEFAULT 0,
    "decommissionRevision" INTEGER NOT NULL DEFAULT 0,
    "decommissionCompletedAt" TIMESTAMP(3),
    "decommissionLeaseId" TEXT,
    "decommissionLeaseExpiresAt" TIMESTAMP(3),

    CONSTRAINT "scimConnectionBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimIdentityTombstone" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provisioningDomainId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalIdKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scimIdentityTombstone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimSubject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileSourceId" TEXT,
    "revision" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scimSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimUser" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provisioningDomainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionUserKey" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userNameKey" TEXT NOT NULL,
    "primaryEmail" TEXT NOT NULL,
    "workEmailValueIndex" TEXT NOT NULL,
    "emailValueIndex" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "formattedName" TEXT NOT NULL,
    "givenName" TEXT,
    "familyName" TEXT,
    "serializedEmails" TEXT NOT NULL,
    "serializedAttributes" TEXT,
    "externalId" TEXT,
    "externalIdKey" TEXT,
    "active" BOOLEAN NOT NULL,
    "orderKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scimUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimProjectionGrant" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provisioningDomainId" TEXT NOT NULL,
    "scimUserId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceValue" TEXT,
    "role" TEXT NOT NULL,
    "grantKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scimProjectionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimGroup" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provisioningDomainId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "displayName" TEXT NOT NULL,
    "displayNameKey" TEXT NOT NULL,
    "externalId" TEXT,
    "externalIdKey" TEXT,
    "orderKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scimGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scimGroupMember" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "scimUserId" TEXT NOT NULL,
    "membershipKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scimGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizationSecurityPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requireMfaForPrivileged" BOOLEAN NOT NULL DEFAULT true,
    "requireSso" BOOLEAN NOT NULL DEFAULT false,
    "sessionMaxMinutes" INTEGER NOT NULL DEFAULT 10080,
    "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 1440,
    "stepUpTtlSeconds" INTEGER NOT NULL DEFAULT 900,
    "breakGlassEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizationSecurityPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stepUpChallenge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stepUpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakGlassGrant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "grantedToUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "ticketReference" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breakGlassGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privilegeElevation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privilegeElevation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessReview" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "initiatedBy" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessReviewItem" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'pending',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "accessReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceIdentity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "securityAuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorUserId" TEXT,
    "actorServiceId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "requestId" TEXT,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "securityAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");

-- CreateIndex
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ssoProvider_providerId_key" ON "ssoProvider"("providerId");

-- CreateIndex
CREATE INDEX "scimManagedConnection_provisioningDomainId_idx" ON "scimManagedConnection"("provisioningDomainId");

-- CreateIndex
CREATE UNIQUE INDEX "scimManagedConnection_creationRequestId_key" ON "scimManagedConnection"("creationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "scimManagedConnection_connectionId_key" ON "scimManagedConnection"("connectionId");

-- CreateIndex
CREATE INDEX "scimManagedCredential_connectionRecordId_idx" ON "scimManagedCredential"("connectionRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "scimManagedCredential_credentialId_key" ON "scimManagedCredential"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "scimManagedCredential_activeSlotKey_key" ON "scimManagedCredential"("activeSlotKey");

-- CreateIndex
CREATE INDEX "scimManagedConnectionEvent_connectionRecordId_idx" ON "scimManagedConnectionEvent"("connectionRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "scimManagedConnectionEvent_eventKey_key" ON "scimManagedConnectionEvent"("eventKey");

-- CreateIndex
CREATE INDEX "scimConnectionBinding_connectionId_idx" ON "scimConnectionBinding"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "scimConnectionBinding_connectionKey_key" ON "scimConnectionBinding"("connectionKey");

-- CreateIndex
CREATE INDEX "scimIdentityTombstone_connectionId_idx" ON "scimIdentityTombstone"("connectionId");

-- CreateIndex
CREATE INDEX "scimIdentityTombstone_provisioningDomainId_idx" ON "scimIdentityTombstone"("provisioningDomainId");

-- CreateIndex
CREATE INDEX "scimIdentityTombstone_userId_idx" ON "scimIdentityTombstone"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scimIdentityTombstone_externalIdKey_key" ON "scimIdentityTombstone"("externalIdKey");

-- CreateIndex
CREATE INDEX "scimSubject_profileSourceId_idx" ON "scimSubject"("profileSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "scimSubject_userId_key" ON "scimSubject"("userId");

-- CreateIndex
CREATE INDEX "scimUser_connectionId_idx" ON "scimUser"("connectionId");

-- CreateIndex
CREATE INDEX "scimUser_provisioningDomainId_idx" ON "scimUser"("provisioningDomainId");

-- CreateIndex
CREATE INDEX "scimUser_userId_idx" ON "scimUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scimUser_connectionUserKey_key" ON "scimUser"("connectionUserKey");

-- CreateIndex
CREATE UNIQUE INDEX "scimUser_userNameKey_key" ON "scimUser"("userNameKey");

-- CreateIndex
CREATE UNIQUE INDEX "scimUser_externalIdKey_key" ON "scimUser"("externalIdKey");

-- CreateIndex
CREATE UNIQUE INDEX "scimUser_orderKey_key" ON "scimUser"("orderKey");

-- CreateIndex
CREATE INDEX "scimProjectionGrant_connectionId_idx" ON "scimProjectionGrant"("connectionId");

-- CreateIndex
CREATE INDEX "scimProjectionGrant_provisioningDomainId_idx" ON "scimProjectionGrant"("provisioningDomainId");

-- CreateIndex
CREATE INDEX "scimProjectionGrant_scimUserId_idx" ON "scimProjectionGrant"("scimUserId");

-- CreateIndex
CREATE INDEX "scimProjectionGrant_userId_idx" ON "scimProjectionGrant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scimProjectionGrant_grantKey_key" ON "scimProjectionGrant"("grantKey");

-- CreateIndex
CREATE INDEX "scimGroup_connectionId_idx" ON "scimGroup"("connectionId");

-- CreateIndex
CREATE INDEX "scimGroup_provisioningDomainId_idx" ON "scimGroup"("provisioningDomainId");

-- CreateIndex
CREATE UNIQUE INDEX "scimGroup_displayNameKey_key" ON "scimGroup"("displayNameKey");

-- CreateIndex
CREATE UNIQUE INDEX "scimGroup_externalIdKey_key" ON "scimGroup"("externalIdKey");

-- CreateIndex
CREATE UNIQUE INDEX "scimGroup_orderKey_key" ON "scimGroup"("orderKey");

-- CreateIndex
CREATE INDEX "scimGroupMember_connectionId_idx" ON "scimGroupMember"("connectionId");

-- CreateIndex
CREATE INDEX "scimGroupMember_groupId_idx" ON "scimGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "scimGroupMember_scimUserId_idx" ON "scimGroupMember"("scimUserId");

-- CreateIndex
CREATE UNIQUE INDEX "scimGroupMember_membershipKey_key" ON "scimGroupMember"("membershipKey");

-- CreateIndex
CREATE UNIQUE INDEX "organizationSecurityPolicy_organizationId_key" ON "organizationSecurityPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "organizationSecurityPolicy_organizationId_idx" ON "organizationSecurityPolicy"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "stepUpChallenge_nonceHash_key" ON "stepUpChallenge"("nonceHash");

-- CreateIndex
CREATE INDEX "stepUpChallenge_organizationId_userId_createdAt_idx" ON "stepUpChallenge"("organizationId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "stepUpChallenge_sessionId_expiresAt_idx" ON "stepUpChallenge"("sessionId", "expiresAt");

-- CreateIndex
CREATE INDEX "breakGlassGrant_organizationId_grantedToUserId_expiresAt_idx" ON "breakGlassGrant"("organizationId", "grantedToUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "breakGlassGrant_organizationId_expiresAt_idx" ON "breakGlassGrant"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "privilegeElevation_organizationId_userId_expiresAt_idx" ON "privilegeElevation"("organizationId", "userId", "expiresAt");

-- CreateIndex
CREATE INDEX "privilegeElevation_organizationId_expiresAt_idx" ON "privilegeElevation"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "accessReview_organizationId_status_dueAt_idx" ON "accessReview"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "accessReviewItem_organizationId_decision_idx" ON "accessReviewItem"("organizationId", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "accessReviewItem_reviewId_userId_resourceType_resourceId_key" ON "accessReviewItem"("reviewId", "userId", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "serviceIdentity_keyId_key" ON "serviceIdentity"("keyId");

-- CreateIndex
CREATE INDEX "serviceIdentity_organizationId_revokedAt_idx" ON "serviceIdentity"("organizationId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "serviceIdentity_organizationId_name_key" ON "serviceIdentity"("organizationId", "name");

-- CreateIndex
CREATE INDEX "securityAuditEvent_organizationId_createdAt_idx" ON "securityAuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "securityAuditEvent_actorUserId_createdAt_idx" ON "securityAuditEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "securityAuditEvent_action_createdAt_idx" ON "securityAuditEvent"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ssoProvider" ADD CONSTRAINT "ssoProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimManagedCredential" ADD CONSTRAINT "scimManagedCredential_connectionRecordId_fkey" FOREIGN KEY ("connectionRecordId") REFERENCES "scimManagedConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimManagedConnectionEvent" ADD CONSTRAINT "scimManagedConnectionEvent_connectionRecordId_fkey" FOREIGN KEY ("connectionRecordId") REFERENCES "scimManagedConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimIdentityTombstone" ADD CONSTRAINT "scimIdentityTombstone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimSubject" ADD CONSTRAINT "scimSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimUser" ADD CONSTRAINT "scimUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimProjectionGrant" ADD CONSTRAINT "scimProjectionGrant_scimUserId_fkey" FOREIGN KEY ("scimUserId") REFERENCES "scimUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimProjectionGrant" ADD CONSTRAINT "scimProjectionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimGroupMember" ADD CONSTRAINT "scimGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "scimGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scimGroupMember" ADD CONSTRAINT "scimGroupMember_scimUserId_fkey" FOREIGN KEY ("scimUserId") REFERENCES "scimUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

