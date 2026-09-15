-- Better Auth 1.7.0-1.7.2 account identity compatibility.
-- Tinlance currently uses credential authentication only, so the issuer for
-- existing credential accounts is the Better Auth credential issuer.
ALTER TABLE "Account"
  ADD COLUMN IF NOT EXISTS "issuer" TEXT NOT NULL DEFAULT 'local:credential';

CREATE UNIQUE INDEX IF NOT EXISTS "Account_issuer_accountId_key"
  ON "Account"("issuer", "accountId");
