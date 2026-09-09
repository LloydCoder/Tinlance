import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hasWorkspacePermission, type WorkspacePrincipal } from "@/lib/workspace/authorization";

export type SecurityPolicyStatus = "DRAFT" | "REVIEW" | "APPROVED" | "ACTIVE" | "DISABLED" | "ARCHIVED";

function requireSecurityAdmin(principal: WorkspacePrincipal) {
  if (!hasWorkspacePermission(principal, "workspace:manage")) throw new Error("policy_management_forbidden");
}

export async function createPolicyDraft(input: { principal: WorkspacePrincipal; name: string; definition: Record<string, unknown>; priority?: number }) {
  requireSecurityAdmin(input.principal);
  const policyId = `sec_policy_${randomUUID().replaceAll("-", "")}`;
  const versionId = `${policyId}_v1`;
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "SecurityPolicy" ("id","organizationId","name","status","priority","createdByUserId","createdAt","updatedAt") VALUES (${policyId},${input.principal.organizationId},${input.name.trim()},'DRAFT',${input.priority ?? 100},${input.principal.userId},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "SecurityPolicyVersion" ("id","policyId","version","definition","createdByUserId","createdAt") VALUES (${versionId},${policyId},1,${JSON.stringify(input.definition)}::jsonb,${input.principal.userId},CURRENT_TIMESTAMP)`);
  });
  return policyId;
}

export async function transitionPolicy(input: { principal: WorkspacePrincipal; policyId: string; from: SecurityPolicyStatus; to: SecurityPolicyStatus }) {
  requireSecurityAdmin(input.principal);
  const allowed: Record<SecurityPolicyStatus, SecurityPolicyStatus[]> = { DRAFT: ["REVIEW"], REVIEW: ["APPROVED", "DRAFT"], APPROVED: ["ACTIVE", "REVIEW"], ACTIVE: ["DISABLED"], DISABLED: ["ACTIVE", "ARCHIVED"], ARCHIVED: [] };
  if (!allowed[input.from].includes(input.to)) throw new Error("invalid_policy_transition");
  const updated = await db.$executeRaw(Prisma.sql`UPDATE "SecurityPolicy" SET "status"=${input.to},"approvedByUserId"=CASE WHEN ${input.to}='APPROVED' THEN ${input.principal.userId} ELSE "approvedByUserId" END,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${input.policyId} AND "organizationId"=${input.principal.organizationId} AND "status"=${input.from}`);
  if (updated !== 1) throw new Error("policy_not_found_or_stale");
}

export async function createPolicyVersion(input: { principal: WorkspacePrincipal; policyId: string; definition: Record<string, unknown> }) {
  requireSecurityAdmin(input.principal);
  const rows = await db.$queryRaw<Array<{ version: number; status: SecurityPolicyStatus }>>(Prisma.sql`SELECT COALESCE(MAX(v.version),0)::int AS version,p.status FROM "SecurityPolicy" p LEFT JOIN "SecurityPolicyVersion" v ON v."policyId"=p.id WHERE p.id=${input.policyId} AND p."organizationId"=${input.principal.organizationId} GROUP BY p.status`);
  const row = rows[0]; if (!row) throw new Error("policy_not_found");
  const next = row.version + 1;
  const id = `${input.policyId}_v${next}`;
  await db.$executeRaw(Prisma.sql`INSERT INTO "SecurityPolicyVersion" ("id","policyId","version","definition","createdByUserId","createdAt") VALUES (${id},${input.policyId},${next},${JSON.stringify(input.definition)}::jsonb,${input.principal.userId},CURRENT_TIMESTAMP)`);
  await db.$executeRaw(Prisma.sql`UPDATE "SecurityPolicy" SET status='DRAFT',"updatedAt"=CURRENT_TIMESTAMP WHERE id=${input.policyId} AND "organizationId"=${input.principal.organizationId}`);
  return { id, version: next };
}
