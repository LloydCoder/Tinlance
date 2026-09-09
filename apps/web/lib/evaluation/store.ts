import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { enforcePersistedSecurity } from "@/lib/security-gateway/runtime";
import { buildPrincipal, hashSensitive } from "@/lib/security-gateway";
import { compareBaseline, createTrace, evaluateGate, gradeCase, type EvaluationCase, type EvaluationExecution, type EvaluationProfile } from "@/lib/evaluation";
import { hasWorkspacePermission, type WorkspacePermission } from "@/lib/workspace/permissions";

export async function authorizeEvaluation(input: { organizationId: string; userId: string; permission: "evaluation:read" | "evaluation:create" | "evaluation:execute" | "evaluation:manage"; action: string; resourceType: string; resourceId?: string; requestId: string }) {
  const [membership, user] = await Promise.all([
    db.member.findUnique({ where: { organizationId_userId: { organizationId: input.organizationId, userId: input.userId } }, select: { role: true } }),
    db.user.findUnique({ where: { id: input.userId }, select: { role: true } }),
  ]);
  if (!membership) throw new Error("evaluation_membership_required");
  const workspace = { memberRole: membership.role, isPrivileged: Boolean(user?.role && ["admin", "super-admin"].includes(user.role)) };
  const permission = input.permission as WorkspacePermission;
  const allowed = hasWorkspacePermission(workspace, permission);
  const principal = buildPrincipal({ principalId: input.userId, principalType: "HUMAN", organizationId: input.organizationId, userId: input.userId, permissions: allowed ? [permission] : [], authenticationMethod: "better-auth-session", authenticationStrength: "MFA" });
  return enforcePersistedSecurity({ principal, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, context: { tenantId: input.organizationId, requiredPermission: permission }, requestedRisk: input.permission === "evaluation:execute" || input.permission === "evaluation:manage" ? "HIGH" : "LOW", requestId: input.requestId });
}

export async function createEvaluationProject(input: { organizationId: string; userId: string; name: string; description?: string }) {
  const id = randomUUID();
  await db.$executeRaw(Prisma.sql`INSERT INTO "EvaluationProject" ("id","organizationId","name","description","createdByUserId") VALUES (${id},${input.organizationId},${input.name},${input.description ?? null},${input.userId})`);
  return id;
}

export async function createTarget(input: { organizationId: string; projectId: string; userId: string; name: string; targetType: string; version: string; environment?: string; metadata?: Record<string, unknown> }) {
  const id = randomUUID();
  const configurationHash = hashSensitive({ name: input.name, targetType: input.targetType, version: input.version, environment: input.environment ?? "sandbox", metadata: input.metadata ?? {} });
  const project = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "EvaluationProject" WHERE id=${input.projectId} AND "organizationId"=${input.organizationId} LIMIT 1`);
  if (!project[0]) throw new Error("evaluation_project_not_found");
  await db.$executeRaw(Prisma.sql`INSERT INTO "EvaluationTarget" ("id","organizationId","projectId","name","targetType","version","environment","configurationHash","metadata","createdByUserId") VALUES (${id},${input.organizationId},${input.projectId},${input.name},${input.targetType},${input.version},${input.environment ?? "sandbox"},${configurationHash},${JSON.stringify(input.metadata ?? {})}::jsonb,${input.userId})`);
  return id;
}

export async function getTarget(organizationId: string, targetId: string) {
  const rows = await db.$queryRaw<Array<{ id: string; organizationId: string; projectId: string; name: string; targetType: string; version: string; environment: string; configurationHash: string; metadata: Record<string, unknown> }>>(Prisma.sql`SELECT "id","organizationId","projectId","name","targetType","version","environment","configurationHash","metadata" FROM "EvaluationTarget" WHERE id=${targetId} AND "organizationId"=${organizationId} LIMIT 1`);
  return rows[0] ?? null;
}

export async function listCases(organizationId: string, datasetSlug = "m8-security", datasetVersion = "1") {
  return db.$queryRaw<Array<{ id: string; category: string; subcategory: string; scenario: string; input: Record<string, unknown>; expectedBehavior: Record<string, unknown>; severity: string; attackTechnique: string | null; grader: string }>>(Prisma.sql`SELECT id,category,subcategory,scenario,input,"expectedBehavior",severity,"attackTechnique",grader FROM "EvaluationCase" WHERE ("organizationId" IS NULL OR "organizationId"=${organizationId}) AND "datasetSlug"=${datasetSlug} AND "datasetVersion"=${datasetVersion} ORDER BY id`);
}

export async function startRun(input: { organizationId: string; projectId: string; targetId: string; suiteId: string; suiteVersion: string; datasetSlug: string; datasetVersion: string; profile: EvaluationProfile; userId: string; commitSha?: string; model?: string }) {
  const target = await getTarget(input.organizationId, input.targetId);
  if (!target) throw new Error("evaluation_target_not_found");
  const id = randomUUID();
  await db.$executeRaw(Prisma.sql`INSERT INTO "EvaluationRun" ("id","organizationId","projectId","targetId","targetVersion","suiteId","suiteVersion","datasetSlug","datasetVersion","graderVersion","environment","commitSha","model","configurationHash","status","createdByUserId","startedAt") VALUES (${id},${input.organizationId},${input.projectId},${input.targetId},${target.version},${input.suiteId},${input.suiteVersion},${input.datasetSlug},${input.datasetVersion},'m8-deterministic-1',${target.environment},${input.commitSha ?? null},${input.model ?? null},${target.configurationHash},'RUNNING',${input.userId},CURRENT_TIMESTAMP)`);
  return id;
}

export async function recordResult(input: { organizationId: string; runId: string; testCase: EvaluationCase; execution: EvaluationExecution; attempt?: number }) {
  const grade = gradeCase(input.testCase, input.execution);
  const id = randomUUID();
  const safeEvidence = { ...grade.evidence, inputHash: hashSensitive(input.testCase.input), executionHash: hashSensitive(input.execution), traceId: input.execution.traceId ?? null };
  await db.$executeRaw(Prisma.sql`INSERT INTO "EvaluationResult" ("id","organizationId","runId","caseId","attempt","status","classification","score","severity","reason","evidence","traceId") VALUES (${id},${input.organizationId},${input.runId},${input.testCase.id},${input.attempt ?? 1},${grade.status},${grade.classification ?? 'NONE'},${grade.score},${grade.severity},${grade.reason},${JSON.stringify(safeEvidence)}::jsonb,${input.execution.traceId ?? null}) ON CONFLICT ("runId","caseId","attempt") DO UPDATE SET "status"=EXCLUDED."status","classification"=EXCLUDED."classification","score"=EXCLUDED."score","severity"=EXCLUDED."severity","reason"=EXCLUDED."reason","evidence"=EXCLUDED."evidence","traceId"=EXCLUDED."traceId`);
  if (grade.status === "FAIL" && (grade.severity === "CRITICAL" || grade.severity === "HIGH")) {
    const run = await db.$queryRaw<Array<{ targetId: string; targetVersion: string; projectId: string; assessmentId: string | null }>>(Prisma.sql`SELECT "targetId","targetVersion","projectId",(SELECT "assessmentId" FROM "AutomationWorkflowRun" WHERE false) AS "assessmentId" FROM "EvaluationRun" WHERE id=${input.runId} AND "organizationId"=${input.organizationId} LIMIT 1`);
    if (run[0]) {
      const assessment = await db.$queryRaw<Array<{ assessmentId: string }>>(Prisma.sql`SELECT "assessmentId" FROM "EvaluationRun" WHERE id=${input.runId} AND "organizationId"=${input.organizationId} LIMIT 1`);
      const assessmentId = assessment[0]?.assessmentId;
      if (assessmentId) {
        const idempotencyKey = `m8:${input.runId}:${input.testCase.id}`;
        await db.$executeRaw(Prisma.sql`INSERT INTO "WorkspaceFinding" ("id","organizationId","projectId","assessmentId","title","description","category","severity","status","recommendation","visibility","authorship","idempotencyKey") VALUES (${randomUUID()},${input.organizationId},${run[0].projectId},${assessmentId},${`M8 evaluation failure: ${input.testCase.category}`},${grade.reason},${input.testCase.category},${input.testCase.severity},'DRAFT_INTERNAL',${"Remediate the failed security invariant and rerun the M8 evaluation."},'TINLANCE_INTERNAL','AI_ASSISTED',${idempotencyKey}) ON CONFLICT ("idempotencyKey") DO NOTHING`);
      }
    }
  }
  return grade;
}

export async function completeRun(input: { organizationId: string; runId: string }) {
  const rows = await db.$queryRaw<Array<{ id: string; targetId: string; status: string }>>(Prisma.sql`SELECT id,"targetId",status FROM "EvaluationRun" WHERE id=${input.runId} AND "organizationId"=${input.organizationId} LIMIT 1`);
  if (!rows[0]) throw new Error("evaluation_run_not_found");
  const results = await db.$queryRaw<Array<{ caseId: string; status: string; classification: string; severity: string }>>(Prisma.sql`SELECT "caseId",status,classification,severity FROM "EvaluationResult" WHERE "runId"=${input.runId} AND "organizationId"=${input.organizationId}`);
  const gradeResults = results.map((r) => ({ status: r.status as "PASS" | "FAIL" | "INCONCLUSIVE" | "ERROR" | "SKIPPED", classification: r.classification === "NONE" ? null : (r.classification as "MODEL_FAILURE" | "SECURITY_FAILURE" | "POLICY_FAILURE" | "TEST_FAILURE" | "INFRASTRUCTURE_FAILURE" | "TIMEOUT" | "COST_LIMIT" | "CONFIGURATION_ERROR" | "INCONCLUSIVE"), score: null, reason: "persisted", severity: r.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO", confidence: 1, evidence: {}, graderVersion: "m8-deterministic-1" }));
  const gate = evaluateGate({ results: gradeResults, regressions: 0 });
  await db.$executeRaw(Prisma.sql`UPDATE "EvaluationRun" SET status=${gate.deploymentAllowed ? "COMPLETED" : "BLOCKED"},"completedAt"=CURRENT_TIMESTAMP,summary=${JSON.stringify(gate)}::jsonb WHERE id=${input.runId} AND "organizationId"=${input.organizationId}`);
  return gate;
}

export async function recordTrace(input: { organizationId: string; runId: string; spanType: string; name: string; metadata?: Record<string, unknown>; request?: unknown; response?: unknown; parentSpanId?: string }) {
  const trace = createTrace({ organizationId: input.organizationId, runId: input.runId, spanType: input.spanType, name: input.name, metadata: input.metadata, input: input.request, output: input.response, parentSpanId: input.parentSpanId });
  await db.$executeRaw(Prisma.sql`INSERT INTO "EvaluationTrace" ("id","organizationId","runId","traceId","parentSpanId","spanType","name","startTime","status","metadata","inputHash","outputHash") VALUES (${trace.id},${input.organizationId},${input.runId},${trace.traceId},${trace.parentSpanId},${trace.spanType},${trace.name},${trace.startTime},${trace.status},${JSON.stringify(trace.metadata)}::jsonb,${trace.inputHash},${trace.outputHash})`);
  return trace;
}

export async function compareRunToBaseline(input: { organizationId: string; runId: string; baselineId: string }) {
  const baseline = await db.$queryRaw<Array<{ snapshot: Record<string, unknown> }>>(Prisma.sql`SELECT snapshot FROM "EvaluationBaseline" WHERE id=${input.baselineId} AND "organizationId"=${input.organizationId} LIMIT 1`);
  if (!baseline[0]) throw new Error("evaluation_baseline_not_found");
  const rows = await db.$queryRaw<Array<{ caseId: string; status: string }>>(Prisma.sql`SELECT "caseId",status FROM "EvaluationResult" WHERE "runId"=${input.runId} AND "organizationId"=${input.organizationId}`);
  return compareBaseline({ baseline: baseline[0].snapshot, current: { cases: Object.fromEntries(rows.map((r) => [r.caseId, r.status])) } });
}
