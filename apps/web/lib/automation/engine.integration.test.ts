import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { cancelAutomation, startAutomation } from "./engine";

const createdOrganizations: string[] = [];

afterEach(async () => {
  for (const organizationId of createdOrganizations.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "Organization" WHERE id=${organizationId}`);
  }
});

describe("M4 durable workflow persistence", () => {
  it("creates an idempotent run and prevents cross-tenant project substitution", async () => {
    const orgA = randomUUID(); const orgB = randomUUID(); const projectA = randomUUID(); const projectB = randomUUID();
    createdOrganizations.push(orgA, orgB);
    await db.$executeRaw(Prisma.sql`INSERT INTO "Organization" (id,name,slug,"createdAt","updatedAt") VALUES (${orgA},'M4 Test A',${`m4-a-${orgA}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),(${orgB},'M4 Test B',${`m4-b-${orgB}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
    await db.$executeRaw(Prisma.sql`INSERT INTO "Project" (id,"organizationId",name,status,"createdAt","updatedAt") VALUES (${projectA},${orgA},'M4 Project A','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),(${projectB},${orgB},'M4 Project B','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);

    const first = await startAutomation({ organizationId: orgA, projectId: projectA, playbookSlug: "fde-technical-assessment", actorUserId: "m4-test-user", triggerType: "TEST", idempotencyKey: "m4-integration-1", requestId: randomUUID(), input: { scope: { target: "synthetic" } } });
    const duplicate = await startAutomation({ organizationId: orgA, projectId: projectA, playbookSlug: "fde-technical-assessment", actorUserId: "m4-test-user", triggerType: "TEST", idempotencyKey: "m4-integration-1", requestId: randomUUID(), input: { scope: { target: "different" } } });
    expect(duplicate.id).toBe(first.id);

    await expect(startAutomation({ organizationId: orgA, projectId: projectB, playbookSlug: "fde-technical-assessment", actorUserId: "m4-test-user", triggerType: "TEST", idempotencyKey: "m4-cross-tenant", requestId: randomUUID(), input: { scope: { target: "synthetic" } })).rejects.toThrow("project not found");
    const cancelled = await cancelAutomation(first.id, orgA, "m4-test-user");
    expect(cancelled.status).toBe("CANCELLED");
  });
});
