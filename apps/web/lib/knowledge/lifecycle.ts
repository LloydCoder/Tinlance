import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildPrincipal, enforceSecurity } from "@/lib/security-gateway";
import { hasWorkspacePermission } from "@/lib/workspace/permissions";

async function memberFor(organizationId: string, userId: string) {
  const rows = await db.$queryRaw<Array<{ role: string; globalRole: string }>>(Prisma.sql`SELECT m.role,u.role AS "globalRole" FROM "Member" m JOIN "User" u ON u.id=m."userId" WHERE m."organizationId"=${organizationId} AND m."userId"=${userId} LIMIT 1`);
  return rows[0] ?? null;
}

export async function publishKnowledge(input:{documentId:string;organizationId:string;userId:string;requestId:string}) {
  const member = await memberFor(input.organizationId, input.userId);
  if (!member || !hasWorkspacePermission({ memberRole: member.role, isPrivileged: ["admin","super-admin"].includes(member.globalRole) }, "knowledge:publish")) throw new Error("knowledge_publish_denied");
  const m7 = await enforceSecurity({ principal: buildPrincipal({ principalId: input.userId, principalType: "HUMAN", organizationId: input.organizationId, userId: input.userId }), action: "knowledge.publish", resourceType: "KnowledgeDocument", resourceId: input.documentId, requestedRisk: "MEDIUM", context: { tenantId: input.organizationId, requiredPermission: "knowledge:publish" }, requestId: input.requestId });
  if (m7.decision !== "ALLOW") throw new Error(`knowledge_publish_denied:${m7.reasonCode}`);
  const result = await db.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ id:string; versionId:string }>>(Prisma.sql`SELECT d.id,d."currentVersionId" AS "versionId" FROM "KnowledgeDocument" d JOIN "KnowledgeCollection" c ON c.id=d."collectionId" AND c.status='ACTIVE' WHERE d.id=${input.documentId} AND d."organizationId"=${input.organizationId} AND d.status='QUARANTINED' LIMIT 1`);
    if (!rows[0] || !rows[0].versionId) throw new Error("knowledge_not_publishable");
    const version = await tx.$queryRaw<Array<{ status:string; reviewStatus:string }>>(Prisma.sql`SELECT status,"reviewStatus" FROM "KnowledgeDocumentVersion" WHERE id=${rows[0].versionId} AND "documentId"=${input.documentId} AND "organizationId"=${input.organizationId} LIMIT 1`);
    if (!version[0] || !["PROCESSING","INDEXING"].includes(version[0].status)) throw new Error("knowledge_version_not_publishable");
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocumentVersion" SET status='ACTIVE',"reviewStatus"='APPROVED' WHERE id=${rows[0].versionId} AND status IN ('PROCESSING','INDEXING')`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocument" SET status='ACTIVE',"publishedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP,"revokedAt"=NULL WHERE id=${input.documentId} AND "organizationId"=${input.organizationId} AND status='QUARANTINED'`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeChunk" SET status='ACTIVE' WHERE "documentId"=${input.documentId} AND "documentVersionId"=${rows[0].versionId} AND "organizationId"=${input.organizationId} AND status='REVOKED'`);
    return rows[0];
  });
  await db.auditEvent.create({ data:{ organizationId:input.organizationId, actorUserId:input.userId, action:"M10_KNOWLEDGE_PUBLISHED", resourceType:"KnowledgeDocument", resourceId:input.documentId, requestId:input.requestId, metadata:{ versionId:result.versionId, securityBoundary:"M10" } } });
}

export async function revokeKnowledge(input:{documentId:string;organizationId:string;userId:string;requestId:string}) {
  const member = await memberFor(input.organizationId, input.userId);
  if (!member || !hasWorkspacePermission({ memberRole: member.role, isPrivileged: ["admin","super-admin"].includes(member.globalRole) }, "knowledge:delete")) throw new Error("knowledge_delete_denied");
  const m7 = await enforceSecurity({ principal: buildPrincipal({ principalId: input.userId, principalType: "HUMAN", organizationId: input.organizationId, userId: input.userId }), action:"knowledge.delete", resourceType:"KnowledgeDocument", resourceId:input.documentId, requestedRisk:"HIGH", context:{ tenantId:input.organizationId, requiredPermission:"knowledge:delete" }, requestId:input.requestId });
  if (m7.decision !== "ALLOW") throw new Error(`knowledge_delete_denied:${m7.reasonCode}`);
  await db.$transaction(async tx => {
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocument" SET status='REVOKED',"revokedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${input.documentId} AND "organizationId"=${input.organizationId}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeChunk" SET status='REVOKED' WHERE "documentId"=${input.documentId} AND "organizationId"=${input.organizationId}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocumentVersion" SET status='REVOKED' WHERE "documentId"=${input.documentId} AND "organizationId"=${input.organizationId}`);
  });
  await db.auditEvent.create({data:{organizationId:input.organizationId,actorUserId:input.userId,action:"M10_KNOWLEDGE_REVOKED",resourceType:"KnowledgeDocument",resourceId:input.documentId,requestId:input.requestId,metadata:{securityBoundary:"M10"}}});
}
