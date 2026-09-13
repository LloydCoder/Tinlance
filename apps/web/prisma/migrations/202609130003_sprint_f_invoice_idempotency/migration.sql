CREATE UNIQUE INDEX "Invoice_proposalId_unique" ON "Invoice"("proposalId") WHERE "proposalId" IS NOT NULL;
