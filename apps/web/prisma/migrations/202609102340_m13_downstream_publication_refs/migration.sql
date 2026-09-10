ALTER TABLE "IntelligencePublication" ADD COLUMN "downstreamResourceId" TEXT;
CREATE INDEX "IntelligencePublication_downstream_idx" ON "IntelligencePublication"("destination","downstreamResourceId");
