ALTER TABLE "Organization" ADD COLUMN "websiteDomain" TEXT;
CREATE UNIQUE INDEX "Organization_websiteDomain_key" ON "Organization"("websiteDomain");
