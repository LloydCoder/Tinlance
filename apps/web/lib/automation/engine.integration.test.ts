import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { cancelAutomation, persistStepOutcome, startAutomation } from "./engine";

const createdOrganizations: string[] = [];
const createdUsers: string[] = [];
const createdProjects: string[] = [];
const createdLeads: string[] = [];
const createdAssessments: string[] = [];
const createdFindings: string[] = [];
const createdRemediations: string[] = [];

afterEach(async () => {
  for (const remediationId of createdRemediations.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "WorkspaceVerification" WHERE "remediationId"=${remediationId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "WorkspaceRemediation" WHERE id=${remediationId}`);
  }
  for (const findingId of createdFindings.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "WorkspaceFinding" WHERE id=${findingId}`);
  }
  for (const assessmentId of createdAssessments.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "WorkspaceAssessment" WHERE "assessmentId"=${assessmentId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "Assessment" WHERE id=${assessmentId}`);
  }
  for (const leadId of createdLeads.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "Lead" WHERE id=${leadId}`);
  }
  for (const projectId of createdProjects.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "ProjectWorkspaceState" WHERE "projectId"=${projectId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "Project" WHERE id=${projectId}`);
  }
  for (const organizationId of createdOrganizations.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "AuditEvent" WHERE "organizationId"=${organizationId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "Organization" WHERE id=${organizationId}`);
  }
  for (const userId of createdUsers.splice(0)) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "AuditEvent" WHERE "actorUserId"=${userId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "User" WHERE id=${userId}`);
  }
});

describe("M4 durable workflow persistence", () => {
  it("creates an idempotent run and prevents cross-tenant project substitution", async () => {
    const orgA = randomUUID();
    const orgB = randomUUID();
    const projectA = randomUUID();
    const projectB = randomUUID();
    const userId = randomUUID();
    const leadId = randomUUID();
    const assessmentId = randomUUID();
    createdOrganizations.push(orgA, orgB);
    createdUsers.push(userId);
    createdProjects.push(projectA, projectB);
    createdLeads.push(leadId);
    createdAssessments.push(assessmentId);

    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "User" (id,name,email,"emailVerified",role,"createdAt","updatedAt")
        VALUES (${userId},'M4 Test User',${`m4-${userId}@example.invalid`},true,'admin',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "Organization" (id,"clerkOrgId",name,slug,"createdAt","updatedAt")
        VALUES
          (${orgA},${`m4-clerk-a-${orgA}`},'M4 Test A',${`m4-a-${orgA}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
          (${orgB},${`m4-clerk-b-${orgB}`},'M4 Test B',${`m4-b-${orgB}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "Project" (id,"organizationId",name,status,"createdAt","updatedAt")
        VALUES
          (${projectA},${orgA},'M4 Project A','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
          (${projectB},${orgB},'M4 Project B','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "Lead" (id,"organizationId","organizationName","contactName",email,country,service)
      VALUES (${leadId},${orgA},'M4 Test Organization','M4 Test Contact',${`m4-lead-${leadId}@example.invalid`},'Nigeria','FDE assessment')
    `);
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "Assessment" (id,"organizationId","leadId",problem,"desiredOutcome","idempotencyKey")
      VALUES (${assessmentId},${orgA},${leadId},'Synthetic assessment problem','Synthetic assessment outcome',${`m4-assessment-${assessmentId}`})
    `);
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "WorkspaceAssessment" (id,"projectId","organizationId","assessmentId",type,objective,scope,methodology,status,"resultStatus","assessorUserId",version)
      VALUES (${randomUUID()},${projectA},${orgA},${assessmentId},'FDE','Synthetic objective',${JSON.stringify({target:"synthetic"})}::jsonb,'Synthetic methodology','PLANNED','NOT_ASSESSED',${userId},'1.0')
    `);

    const first = await startAutomation({
      organizationId: orgA,
      projectId: projectA,
      assessmentId,
      playbookSlug: "fde-technical-assessment",
      actorUserId: userId,
      triggerType: "TEST",
      idempotencyKey: `m4-integration-1-${orgA}`,
      requestId: randomUUID(),
      input: { scope: { target: "synthetic" } },
    });
    const duplicate = await startAutomation({
      organizationId: orgA,
      projectId: projectA,
      assessmentId,
      playbookSlug: "fde-technical-assessment",
      actorUserId: userId,
      triggerType: "TEST",
      idempotencyKey: `m4-integration-1-${orgA}`,
      requestId: randomUUID(),
      input: { scope: { target: "different" } },
    });
    expect(duplicate.id).toBe(first.id);

    await expect(
      startAutomation({
        organizationId: orgA,
        projectId: projectB,
        assessmentId,
        playbookSlug: "fde-technical-assessment",
        actorUserId: userId,
        triggerType: "TEST",
        idempotencyKey: `m4-cross-tenant-${orgA}`,
        requestId: randomUUID(),
        input: { scope: { target: "synthetic" } },
      })
    ).rejects.toThrow("project not found");

    const cancelled = await cancelAutomation(first.id, orgA, userId);
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("does not turn customer workflow input into independent remediation verification", async () => {
    const organizationId = randomUUID();
    const projectId = randomUUID();
    const userId = randomUUID();
    const leadId = randomUUID();
    const assessmentId = randomUUID();
    const findingId = randomUUID();
    const remediationId = randomUUID();
    const runId = randomUUID();
    const stepId = randomUUID();
    createdOrganizations.push(organizationId);
    createdProjects.push(projectId);
    createdUsers.push(userId);
    createdLeads.push(leadId);
    createdAssessments.push(assessmentId);
    createdFindings.push(findingId);
    createdRemediations.push(remediationId);

    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "User" (id,name,email,"emailVerified",role,"createdAt","updatedAt")
        VALUES (${userId},'M4 Verification Owner',${`m4-verification-${userId}@example.invalid`},true,'admin',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "Organization" (id,"clerkOrgId",name,slug,"createdAt","updatedAt")
        VALUES (${organizationId},${`m4-verification-org-${organizationId}`},'M4 Verification Org',${`m4-verification-${organizationId}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "Project" (id,"organizationId",name,status,"createdAt","updatedAt")
        VALUES (${projectId},${organizationId},'M4 Verification Project','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "Lead" (id,"organizationId","organizationName","contactName",email,country,service)
      VALUES (${leadId},${organizationId},'M4 Verification Org','M4 Verification Contact',${`m4-lead-${leadId}@example.invalid`},'Nigeria','FDE assessment')
    `);
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "Assessment" (id,"organizationId","leadId",problem,"desiredOutcome","idempotencyKey")
      VALUES (${assessmentId},${organizationId},${leadId},'Synthetic assessment problem','Synthetic assessment outcome',${`m4-assessment-${assessmentId}`})
    `);
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "WorkspaceAssessment" (id,"projectId","organizationId","assessmentId",type,objective,scope,methodology,status,"resultStatus","assessorUserId",version)
      VALUES (${randomUUID()},${projectId},${organizationId},${assessmentId},'FDE','Synthetic objective',${JSON.stringify({target:"synthetic"})}::jsonb,'Synthetic methodology','PLANNED','NOT_ASSESSED',${userId},'1.0')
    `);
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "WorkspaceFinding" (id,"organizationId","projectId","assessmentId",title,description,category,severity,status,recommendation,"ownerUserId",visibility,authorship,"idempotencyKey","createdAt","updatedAt")
        VALUES (${findingId},${organizationId},${projectId},${assessmentId},'M4 verification finding','Synthetic test finding','security','HIGH','OPEN','Apply the remediation',${userId},'CUSTOMER','HUMAN_AUTHORED',${`${runId}:finding:${findingId}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );
    await db.$executeRaw(
      Prisma.sql`
        INSERT INTO "WorkspaceRemediation" (id,"organizationId","projectId","findingId",title,description,"ownerUserId",priority,status,"verificationStatus","idempotencyKey","createdAt","updatedAt")
        VALUES (${remediationId},${organizationId},${projectId},${findingId},'M4 verification remediation','Synthetic remediation',${userId},'HIGH','OPEN','INCONCLUSIVE',${`${runId}:remediation:${findingId}`},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `
    );

    const run = {
      id: runId,
      organization_id: organizationId,
      project_id: projectId,
      assessment_id: assessmentId,
      playbook_id: "playbook-m4-verification",
      playbook_version_id: "playbook-version-m4-verification",
      status: "RUNNING" as const,
      trigger_type: "TEST",
      initiating_actor_user_id: userId,
      request_id: randomUUID(),
      current_step: 0,
      state: { verificationEvidenceId: "customer-supplied-evidence", verificationResult: "PASS" },
      result: null,
      error_code: null,
      error_message: null,
      started_at: new Date(),
    };
    const step = {
      id: stepId,
      workflow_run_id: runId,
      step_key: "verification",
      ordinal: 0,
      step_type: "CUSTOMER_INPUT" as const,
      status: "RUNNING" as const,
      input: {},
      output: null,
      capability_id: null,
      capability_version: null,
      required_approval: false,
      authorization_decision: null,
    };

    await expect(db.$transaction(tx => persistStepOutcome(
      tx,
      run,
      step,
      { evidenceId: "customer-supplied-evidence", result: "PASS" },
      { key: "verification", type: "CUSTOMER_INPUT" },
    ))).rejects.toThrow("independent_verification_pending");

    const [remediations, findings, verifications] = await Promise.all([
      db.$queryRaw<Array<{ status: string }>>(Prisma.sql`SELECT status FROM "WorkspaceRemediation" WHERE id=${remediationId}`),
      db.$queryRaw<Array<{ status: string }>>(Prisma.sql`SELECT status FROM "WorkspaceFinding" WHERE id=${findingId}`),
      db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "WorkspaceVerification" WHERE "remediationId"=${remediationId}`),
    ]);

    expect(remediations[0]?.status).toBe("OPEN");
    expect(findings[0]?.status).toBe("OPEN");
    expect(verifications).toHaveLength(0);
  });
});
