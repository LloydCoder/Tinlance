-- Better Auth 1.6+ account identity hardening.
-- Better Auth now persists the trusted issuer alongside accountId.
-- This migration is intentionally additive and preserves the existing
-- providerId/accountId uniqueness constraint for compatibility.

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "issuer" TEXT;

-- Backfill credential accounts using the linked user's immutable id.
UPDATE "Account"
SET "issuer" = 'local:credential'
WHERE "issuer" IS NULL AND "providerId" = 'credential';

-- Backfill non-credential providers into their deterministic local namespace.
-- Provider IDs are percent-encoded to avoid namespace ambiguity.
UPDATE "Account"
SET "issuer" = 'local:oauth:' || replace(replace(replace(replace("providerId", '%', '%25'), ':', '%3A'), '/', '%2F'), ' ', '%20')
WHERE "issuer" IS NULL AND "providerId" <> 'credential';

-- Fail closed if any pre-existing row could not be assigned a trusted issuer.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Account" WHERE "issuer" IS NULL) THEN
    RAISE EXCEPTION 'Better Auth Account issuer backfill incomplete: one or more Account rows have no issuer';
  END IF;
END $$;

-- Detect identity collisions before enforcing the Better Auth identity key.
DO $$
BEGIN
  IF EXISTS (
    SELECT "issuer", "accountId"
    FROM "Account"
    GROUP BY "issuer", "accountId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Better Auth Account issuer/accountId collision detected; migration aborted';
  END IF;
END $$;

ALTER TABLE "Account" ALTER COLUMN "issuer" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Account_issuer_accountId_key"
  ON "Account"("issuer", "accountId");

CREATE INDEX IF NOT EXISTS "Account_issuer_idx" ON "Account"("issuer");
