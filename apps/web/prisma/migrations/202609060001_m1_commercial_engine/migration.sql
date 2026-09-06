CREATE TYPE "QualificationStatus" AS ENUM ('PENDING', 'QUALIFIED', 'DISQUALIFIED');
CREATE TYPE "OpportunityStage" AS ENUM ('NEW', 'ASSESSMENT_REQUESTED', 'QUALIFYING', 'QUALIFIED', 'DISQUALIFIED', 'BOOKING_PENDING', 'BOOKED', 'ASSESSMENT_COMPLETE', 'PROPOSAL_DRAFT', 'PROPOSAL_SENT', 'PROPOSAL_VIEWED', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'ENGAGEMENT_PENDING', 'ACTIVE', 'COMPLETED');
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "EngagementStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DeliveryModel" AS ENUM ('PROJECT', 'FDE_SPRINT', 'FRACTIONAL_FDE', 'RETAINER');

ALTER TABLE "Lead"
  ADD COLUMN "campaign" TEXT,
  ADD COLUMN "referral" TEXT,
  ADD COLUMN "roleTitle" TEXT,
  ADD COLUMN "companySize" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "problemStatement" TEXT,
  ADD COLUMN "desiredOutcome" TEXT,
  ADD COLUMN "urgency" TEXT,
  ADD COLUMN "budgetSignal" TEXT,
  ADD COLUMN "timeline" TEXT,
  ADD COLUMN "technicalEnvironment" TEXT,
  ADD COLUMN "securitySensitivity" TEXT,
  ADD COLUMN "qualificationScore" INTEGER,
  ADD COLUMN "qualificationStatus" "QualificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "ownerUserId" TEXT,
  ADD COLUMN "nextAction" TEXT,
  ADD COLUMN "nextActionAt" TIMESTAMP(3),
  ADD COLUMN "consent" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "leadId" TEXT NOT NULL,
  "problem" TEXT NOT NULL,
  "workflow" TEXT,
  "currentArchitecture" TEXT,
  "constraints" TEXT,
  "desiredOutcome" TEXT NOT NULL,
  "urgency" TEXT,
  "stakeholders" TEXT,
  "existingSystems" TEXT,
  "securityRequirements" TEXT,
  "businessImpact" TEXT,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "summary" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "leadId" TEXT NOT NULL,
  "assessmentId" TEXT,
  "ownerUserId" TEXT,
  "stage" "OpportunityStage" NOT NULL DEFAULT 'NEW',
  "valueMinor" INTEGER,
  "currency" TEXT DEFAULT 'USD',
  "nextAction" TEXT,
  "nextActionAt" TIMESTAMP(3),
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lostReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Proposal" (
  "id" TEXT NOT NULL,
  "proposalNumber" TEXT NOT NULL,
  "organizationId" TEXT,
  "leadId" TEXT NOT NULL,
  "assessmentId" TEXT,
  "opportunityId" TEXT,
  "title" TEXT NOT NULL,
  "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "publicTokenHash" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "viewedAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "acceptedByName" TEXT,
  "acceptedByEmail" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProposalVersion" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "executiveSummary" TEXT NOT NULL,
  "problemDefinition" TEXT NOT NULL,
  "proposedSolution" TEXT NOT NULL,
  "scope" JSONB NOT NULL,
  "deliverables" JSONB NOT NULL,
  "assumptions" JSONB NOT NULL,
  "exclusions" JSONB NOT NULL,
  "timeline" JSONB NOT NULL,
  "milestones" JSONB NOT NULL,
  "pricing" JSONB NOT NULL,
  "paymentSchedule" JSONB NOT NULL,
  "dependencies" JSONB NOT NULL,
  "securityConsiderations" TEXT,
  "acceptanceTerms" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Client" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "onboardedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Engagement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "opportunityId" TEXT,
  "proposalId" TEXT,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "commercialValueMinor" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "startDate" TIMESTAMP(3),
  "expectedEndDate" TIMESTAMP(3),
  "ownerUserId" TEXT,
  "deliveryModel" "DeliveryModel" NOT NULL,
  "status" "EngagementStatus" NOT NULL DEFAULT 'PENDING',
  "billingRelationship" TEXT,
  "securityRequirements" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EngagementMilestone" (
  "id" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "dueAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EngagementMilestone_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Booking" ADD COLUMN "leadId" TEXT, ADD COLUMN "assessmentId" TEXT, ADD COLUMN "opportunityId" TEXT;
ALTER TABLE "Project" ADD COLUMN "engagementId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "engagementId" TEXT;

CREATE UNIQUE INDEX "Contact_organizationId_email_key" ON "Contact"("organizationId", "email");
CREATE INDEX "Contact_organizationId_createdAt_idx" ON "Contact"("organizationId", "createdAt");
CREATE UNIQUE INDEX "Assessment_idempotencyKey_key" ON "Assessment"("idempotencyKey");
CREATE INDEX "Assessment_leadId_createdAt_idx" ON "Assessment"("leadId", "createdAt");
CREATE INDEX "Assessment_organizationId_createdAt_idx" ON "Assessment"("organizationId", "createdAt");
CREATE UNIQUE INDEX "Opportunity_assessmentId_key" ON "Opportunity"("assessmentId");
CREATE INDEX "Opportunity_stage_nextActionAt_idx" ON "Opportunity"("stage", "nextActionAt");
CREATE INDEX "Opportunity_organizationId_stage_idx" ON "Opportunity"("organizationId", "stage");
CREATE INDEX "Opportunity_ownerUserId_stage_nextActionAt_idx" ON "Opportunity"("ownerUserId", "stage", "nextActionAt");
CREATE INDEX "Opportunity_lastActivityAt_idx" ON "Opportunity"("lastActivityAt");
CREATE UNIQUE INDEX "Booking_assessmentId_key" ON "Booking"("assessmentId");
CREATE INDEX "Booking_opportunityId_startsAt_idx" ON "Booking"("opportunityId", "startsAt");
CREATE UNIQUE INDEX "Proposal_proposalNumber_key" ON "Proposal"("proposalNumber");
CREATE UNIQUE INDEX "Proposal_publicTokenHash_key" ON "Proposal"("publicTokenHash");
CREATE INDEX "Proposal_organizationId_status_idx" ON "Proposal"("organizationId", "status");
CREATE INDEX "Proposal_leadId_createdAt_idx" ON "Proposal"("leadId", "createdAt");
CREATE INDEX "Proposal_opportunityId_createdAt_idx" ON "Proposal"("opportunityId", "createdAt");
CREATE UNIQUE INDEX "ProposalVersion_proposalId_version_key" ON "ProposalVersion"("proposalId", "version");
CREATE INDEX "ProposalVersion_proposalId_createdAt_idx" ON "ProposalVersion"("proposalId", "createdAt");
CREATE UNIQUE INDEX "Client_organizationId_key" ON "Client"("organizationId");
CREATE UNIQUE INDEX "Engagement_opportunityId_key" ON "Engagement"("opportunityId");
CREATE UNIQUE INDEX "Engagement_proposalId_key" ON "Engagement"("proposalId");
CREATE INDEX "Engagement_organizationId_status_idx" ON "Engagement"("organizationId", "status");
CREATE INDEX "Engagement_clientId_status_idx" ON "Engagement"("clientId", "status");
CREATE INDEX "EngagementMilestone_engagementId_status_idx" ON "EngagementMilestone"("engagementId", "status");
CREATE INDEX "Project_engagementId_status_idx" ON "Project"("engagementId", "status");
CREATE INDEX "Invoice_engagementId_status_idx" ON "Invoice"("engagementId", "status");
CREATE INDEX "Lead_qualificationStatus_nextActionAt_idx" ON "Lead"("qualificationStatus", "nextActionAt");
CREATE INDEX "Lead_ownerUserId_nextActionAt_idx" ON "Lead"("ownerUserId", "nextActionAt");

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngagementMilestone" ADD CONSTRAINT "EngagementMilestone_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
