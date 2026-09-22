import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { GET as getProjects, POST as createProject } from "@/app/api/v1/projects/route";
import { GET as getProject } from "@/app/api/v1/projects/[projectId]/route";

const created: Array<{ organizationIds: string[]; userId: string; credentialId: string }> = [];
function keyHash(value: string) { return createHash("sha256").update(value).digest("hex"); }

async function fixture() {
  const organizationId = randomUUID(); const otherOrganizationId = randomUUID(); const userId = randomUUID(); const projectA = randomUUID(); const projectB = randomUUID(); const credentialId = randomUUID(); const secret = `tl_live_${randomBytes(32).toString("base64url")}`; const prefix = secret.slice(0, 16);
  await db.$executeRaw(Prisma.sql`INSERT INTO "User" (id,name,email,"emailVerified",role,"createdAt","updatedAt") VALUES (${userId},'M5 API Test',${`m5-${userId}@example.invalid`},true,'admin',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
  await db.$executeRaw(Prisma.sql`INSERT INTO "Organization" (id,"clerkOrgId",name,slug,"createdAt","updatedAt") VALUES (${organizationId},${`m5-${organizationId}`},'M5 API Test Org',${`m5-${organizationId}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),(${otherOrganizationId},${`m5-${otherOrganizationId}`},'M5 Other Org',${`m5-${otherOrganizationId}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
  await db.member.create({ data: { id: randomUUID(), organizationId, userId, role: "owner", createdAt: new Date() } });
  await db.$executeRaw(Prisma.sql`INSERT INTO "Project" (id,"organizationId",name,status,"createdAt","updatedAt") VALUES (${projectA},${organizationId},'M5 Project A','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),(${projectB},${otherOrganizationId},'M5 Project B','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
  await db.$executeRaw(Prisma.sql`INSERT INTO "ApiCredential" (id,"organizationId","createdByUserId",name,prefix,"secretHash",scopes,"createdAt","updatedAt") VALUES (${credentialId},${organizationId},${userId},'M5 Test Key',${prefix},${keyHash(secret)},'["projects:read","projects:write"]'::jsonb,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
  created.push({ organizationIds: [organizationId, otherOrganizationId], userId, credentialId }); return { organizationId, otherOrganizationId, projectA, projectB, secret };
}

afterEach(async () => { for (const item of created.splice(0)) { for (const organizationId of item.organizationIds) { await db.$executeRaw(Prisma.sql`DELETE FROM "ApiWebhookDelivery" WHERE "eventId" IN (SELECT id FROM "ApiEvent" WHERE "organizationId"=${organizationId})`); await db.$executeRaw(Prisma.sql`DELETE FROM "ApiEvent" WHERE "organizationId"=${organizationId}`); await db.$executeRaw(Prisma.sql`DELETE FROM "ApiIdempotencyKey" WHERE "organizationId"=${organizationId}`); await db.$executeRaw(Prisma.sql`DELETE FROM "ProjectWorkspaceState" WHERE "organizationId"=${organizationId}`); await db.$executeRaw(Prisma.sql`DELETE FROM "Project" WHERE "organizationId"=${organizationId}`); await db.$executeRaw(Prisma.sql`DELETE FROM "Organization" WHERE id=${organizationId}`); } await db.$executeRaw(Prisma.sql`DELETE FROM "ApiCredential" WHERE id=${item.credentialId}`); await db.$executeRaw(Prisma.sql`DELETE FROM "User" WHERE id=${item.userId}`); } });

describe("M5 public API security", () => {
  it("prevents duplicate creation under concurrent idempotent requests", async () => {
    const f = await fixture();
    const headers = { authorization: `Bearer ${f.secret}`, "content-type": "application/json", "idempotency-key": `concurrent-${f.organizationId}` };
    const body = JSON.stringify({ name: "Concurrent idempotent project" });
    const [first, second] = await Promise.all([
      createProject(new Request("https://tinlance.test/v1/projects", { method: "POST", headers, body })),
      createProject(new Request("https://tinlance.test/v1/projects", { method: "POST", headers, body })),
    ]);
    expect([first.status, second.status].sort()).toEqual([201, 201]);
    const firstBody = await first.json();
    const secondBody = await second.json();
    expect(firstBody.data.id).toBe(secondBody.data.id);
    const rows = await db.project.findMany({ where: { organizationId: f.organizationId, name: "Concurrent idempotent project" }, select: { id: true } });
    expect(rows).toHaveLength(1);
  });

  it("rejects idempotency-key reuse with a different request", async () => {
    const f = await fixture();
    const headers = { authorization: `Bearer ${f.secret}`, "content-type": "application/json", "idempotency-key": `conflict-${f.organizationId}` };
    const first = await createProject(new Request("https://tinlance.test/v1/projects", { method: "POST", headers, body: JSON.stringify({ name: "Original request" }) }));
    expect(first.status).toBe(201);
    const conflict = await createProject(new Request("https://tinlance.test/v1/projects", { method: "POST", headers, body: JSON.stringify({ name: "Different request" }) }));
    expect(conflict.status).toBe(409);
    const body = await conflict.json();
    expect(body.code).toBe("idempotency_conflict");
  });

  it("isolates tenant data and replays idempotent project creation without duplication", async () => {
    const f = await fixture(); const headers = { authorization: `Bearer ${f.secret}`, "content-type": "application/json", "idempotency-key": `project-create-${f.organizationId}` };
    const first = await createProject(new Request("https://tinlance.test/v1/projects", { method: "POST", headers, body: JSON.stringify({ name: "Idempotent project" }) })); expect(first.status).toBe(201); const firstBody = await first.json();
    const replay = await createProject(new Request("https://tinlance.test/v1/projects", { method: "POST", headers, body: JSON.stringify({ name: "Idempotent project" }) })); expect(replay.status).toBe(201); const replayBody = await replay.json(); expect(replayBody.data.id).toBe(firstBody.data.id);
    const list = await getProjects(new Request("https://tinlance.test/v1/projects", { headers: { authorization: `Bearer ${f.secret}` } })); const listBody = await list.json(); expect(listBody.data.data.filter((p: { name: string }) => p.name === "Idempotent project")).toHaveLength(1);
    const cross = await getProject(new Request(`https://tinlance.test/v1/projects/${f.projectB}`, { headers: { authorization: `Bearer ${f.secret}` } }), { params: Promise.resolve({ projectId: f.projectB }) }); expect(cross.status).toBe(404);
  });
});


describe("Gate C database tenant integrity", () => {
  it("rejects a workspace child row whose project belongs to another organization", async () => {
    const f = await fixture();
    await expect(
      db.$executeRaw(
        Prisma.sql`INSERT INTO "ProjectWorkspaceState" ("id","projectId","organizationId","status","priority","createdAt","updatedAt")
          VALUES (${randomUUID()}, ${f.projectA}, ${f.otherOrganizationId}, 'DRAFT', 'normal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      ),
    ).rejects.toThrow(/ProjectWorkspaceState_project_tenant_fkey/);
  });

  it("exposes the Gate C composite tenant foreign key as an enforced database constraint", async () => {
    const rows = await db.$queryRaw<Array<{ constraintName: string; validated: boolean }>>(
      Prisma.sql`SELECT conname AS "constraintName", convalidated AS "validated"
        FROM pg_constraint
        WHERE conname = 'ProjectWorkspaceState_project_tenant_fkey'`,
    );
    expect(rows).toEqual([{ constraintName: "ProjectWorkspaceState_project_tenant_fkey", validated: true }]);
  });
});