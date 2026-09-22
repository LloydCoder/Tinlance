import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export type IdempotencyReplay = Readonly<{ replayed: true; statusCode: number; responseBody: unknown; }>;
export type IdempotencyCreated<T> = Readonly<{ replayed: false; statusCode: number; responseBody: unknown; value: T; }>;

export class IdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency key was already used with a different request");
    this.name = "IdempotencyConflictError";
  }
}

type IdempotencyInput = Readonly<{
  organizationId: string;
  credentialId: string | null;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  ttlHours?: number;
}>;

type IdempotencyResult<T> = IdempotencyReplay | IdempotencyCreated<T>;

export async function runIdempotentMutation<T>(
  input: IdempotencyInput,
  operation: (tx: Prisma.TransactionClient) => Promise<{ statusCode: number; responseBody: unknown; value: T }>,
): Promise<IdempotencyResult<T>> {
  const ttlHours = input.ttlHours ?? 24;

  return db.$transaction(async (tx) => {
    await tx.$executeRaw(
      Prisma.sql`DELETE FROM "ApiIdempotencyKey"
        WHERE "organizationId"=${input.organizationId}
          AND "key"=${input.key}
          AND "method"=${input.method}
          AND "path"=${input.path}
          AND "expiresAt" <= CURRENT_TIMESTAMP`,
    );

    const inserted = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`INSERT INTO "ApiIdempotencyKey"
        ("id","organizationId","credentialId","key","method","path","requestHash","statusCode","responseBody","createdAt","expiresAt")
        VALUES (
          ${`idem_${randomUUID().replaceAll("-", "")}`},
          ${input.organizationId},
          ${input.credentialId},
          ${input.key},
          ${input.method},
          ${input.path},
          ${input.requestHash},
          0,
          '{}'::jsonb,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP + (${ttlHours} * INTERVAL '1 hour')
        )
        ON CONFLICT ("organizationId","key","method","path") DO NOTHING
        RETURNING "id"`,
    );

    if (!inserted[0]) {
      const existing = await tx.$queryRaw<Array<{ requestHash: string; statusCode: number; responseBody: unknown }>>(
        Prisma.sql`SELECT "requestHash","statusCode","responseBody"
          FROM "ApiIdempotencyKey"
          WHERE "organizationId"=${input.organizationId}
            AND "key"=${input.key}
            AND "method"=${input.method}
            AND "path"=${input.path}
            AND "expiresAt" > CURRENT_TIMESTAMP
          LIMIT 1`,
      );
      if (!existing[0]) throw new Error("idempotency_record_unavailable");
      if (existing[0].requestHash !== input.requestHash) throw new IdempotencyConflictError();
      return { replayed: true, statusCode: existing[0].statusCode, responseBody: existing[0].responseBody };
    }

    const result = await operation(tx);
    await tx.$executeRaw(
      Prisma.sql`UPDATE "ApiIdempotencyKey"
        SET "statusCode"=${result.statusCode},
            "responseBody"=${JSON.stringify(result.responseBody)}::jsonb
        WHERE "id"=${inserted[0].id}`,
    );
    return { replayed: false, statusCode: result.statusCode, responseBody: result.responseBody, value: result.value };
  });
}