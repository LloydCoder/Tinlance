CREATE TABLE "ClientAccessInvite" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientAccessInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClientAccessInvite_tokenHash_key" ON "ClientAccessInvite"("tokenHash");
CREATE INDEX "ClientAccessInvite_clientId_email_idx" ON "ClientAccessInvite"("clientId", "email");
CREATE INDEX "ClientAccessInvite_expiresAt_idx" ON "ClientAccessInvite"("expiresAt");
ALTER TABLE "ClientAccessInvite" ADD CONSTRAINT "ClientAccessInvite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
