CREATE TABLE "UsageEvent" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "requestId" TEXT NOT NULL, "credentialId" TEXT,
  "metric" TEXT NOT NULL, "quantity" BIGINT NOT NULL DEFAULT 1, "unit" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id"), CONSTRAINT "UsageEvent_quantity_positive" CHECK ("quantity" > 0)
);
CREATE UNIQUE INDEX "UsageEvent_requestId_metric_key" ON "UsageEvent"("requestId","metric");
CREATE INDEX "UsageEvent_organizationId_occurredAt_idx" ON "UsageEvent"("organizationId","occurredAt");
CREATE INDEX "UsageEvent_organizationId_metric_occurredAt_idx" ON "UsageEvent"("organizationId","metric","occurredAt");
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "ApiCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "UsagePlan" ("id" TEXT NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"currency" TEXT NOT NULL DEFAULT 'USD',"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "UsagePlan_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "UsagePlan_code_key" ON "UsagePlan"("code");
CREATE TABLE "UsagePlanRate" ("id" TEXT NOT NULL,"planId" TEXT NOT NULL,"metric" TEXT NOT NULL,"includedQuantity" BIGINT NOT NULL DEFAULT 0,"unitPriceMinor" BIGINT NOT NULL DEFAULT 0,"unit" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "UsagePlanRate_pkey" PRIMARY KEY ("id"),CONSTRAINT "UsagePlanRate_included_nonnegative" CHECK ("includedQuantity" >= 0),CONSTRAINT "UsagePlanRate_price_nonnegative" CHECK ("unitPriceMinor" >= 0));
CREATE UNIQUE INDEX "UsagePlanRate_planId_metric_key" ON "UsagePlanRate"("planId","metric");
ALTER TABLE "UsagePlanRate" ADD CONSTRAINT "UsagePlanRate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "UsagePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "OrganizationUsagePlan" ("organizationId" TEXT NOT NULL,"planId" TEXT NOT NULL,"effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "OrganizationUsagePlan_pkey" PRIMARY KEY ("organizationId"));
ALTER TABLE "OrganizationUsagePlan" ADD CONSTRAINT "OrganizationUsagePlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationUsagePlan" ADD CONSTRAINT "OrganizationUsagePlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "UsagePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "Incident" ("id" TEXT NOT NULL,"organizationId" TEXT,"title" TEXT NOT NULL,"severity" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'DETECTED',"summary" TEXT NOT NULL,"detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"containedAt" TIMESTAMP(3),"resolvedAt" TIMESTAMP(3),"correlationId" TEXT,"createdByUserId" TEXT NOT NULL,"updatedAt" TIMESTAMP(3) NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Incident_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Incident_organizationId_status_detectedAt_idx" ON "Incident"("organizationId","status","detectedAt");
CREATE INDEX "Incident_severity_status_idx" ON "Incident"("severity","status");
CREATE INDEX "Incident_correlationId_idx" ON "Incident"("correlationId");
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "IncidentEvent" ("id" TEXT NOT NULL,"incidentId" TEXT NOT NULL,"type" TEXT NOT NULL,"actorUserId" TEXT,"requestId" TEXT,"message" TEXT NOT NULL,"metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id"));
CREATE INDEX "IncidentEvent_incidentId_createdAt_idx" ON "IncidentEvent"("incidentId","createdAt");
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "UsagePlan" ("id","code","name","currency","active","updatedAt") VALUES ('plan_free','FREE','Free','USD',true,CURRENT_TIMESTAMP),('plan_growth','GROWTH','Growth','USD',true,CURRENT_TIMESTAMP),('plan_enterprise','ENTERPRISE','Enterprise','USD',true,CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "UsagePlanRate" ("id","planId","metric","includedQuantity","unitPriceMinor","unit") VALUES ('rate_free_api','plan_free','api_requests',1000,0,'request'),('rate_growth_api','plan_growth','api_requests',10000,2,'request'),('rate_enterprise_api','plan_enterprise','api_requests',100000,1,'request'),('rate_free_assess','plan_free','assessment_executions',5,0,'execution'),('rate_growth_assess','plan_growth','assessment_executions',100,500,'execution'),('rate_enterprise_assess','plan_enterprise','assessment_executions',1000,300,'execution') ON CONFLICT ("planId","metric") DO NOTHING;
