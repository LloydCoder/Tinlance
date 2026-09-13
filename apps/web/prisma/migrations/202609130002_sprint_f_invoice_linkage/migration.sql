ALTER TABLE "Invoice" ADD COLUMN "proposalId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL;
CREATE INDEX "Invoice_proposalId_status_idx" ON "Invoice"("proposalId", "status");
CREATE INDEX "Invoice_customerEmail_idx" ON "Invoice"("customerEmail");
