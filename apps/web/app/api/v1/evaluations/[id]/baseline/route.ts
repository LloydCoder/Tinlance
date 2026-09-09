import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { authorizeEvaluation } from "@/lib/evaluation/store";
import { hashEvidence } from "@/lib/evaluation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const requestId = getRequestId(request);
  const decision = await authorizeEvaluation({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, permission: "evaluation:manage", action: "evaluation.baseline.create", resourceType: "EvaluationBaseline", resourceId: id, requestId });
  if (decision.decision !== "ALLOW") return problem(requestId, 403, "evaluation_authorization_denied", "Baseline creation denied");
  const runs = await db.$queryRaw<Array<{ id: string; targetId: string; targetVersion: string; suiteId: string; suiteVersion: string; datasetSlug: string; datasetVersion: string; graderVersion: string; commitSha: string | null }>>(Prisma.sql`SELECT id,"targetId","targetVersion","suiteId","suiteVersion","datasetSlug","datasetVersion","graderVersion","commitSha" FROM "EvaluationRun" WHERE id=${id} AND "organizationId"=${auth.principal.organizationId} AND status='COMPLETED' LIMIT 1`);
  if (!runs[0]) return problem(requestId, 409, "baseline_requires_passing_run", "Only a completed passing evaluation can become a baseline");
  const results = await db.$queryRaw<Array<{ caseId: string; status: string }>>(Prisma.sql`SELECT "caseId",status FROM "EvaluationResult" WHERE "runId"=${id} AND "organizationId"=${auth.principal.organizationId}`);
  if (!results.length || results.some((result) => result.status !== "PASS")) return problem(requestId, 409, "baseline_requires_all_pass", "Baseline requires every evaluated case to pass");
  const snapshot = { cases: Object.fromEntries(results.map((result) => [result.caseId, result.status])) };
  const baselineId = randomUUID();
  await db.$executeRaw(Prisma.sql`INSERT INTO "EvaluationBaseline" ("id","organizationId","targetId","targetVersion","suiteId","suiteVersion","datasetSlug","datasetVersion","graderVersion","commitSha","snapshot","contentHash","createdByUserId") VALUES (${baselineId},${auth.principal.organizationId},${runs[0].targetId},${runs[0].targetVersion},${runs[0].suiteId},${runs[0].suiteVersion},${runs[0].datasetSlug},${runs[0].datasetVersion},${runs[0].graderVersion},${runs[0].commitSha},${JSON.stringify(snapshot)}::jsonb,${hashEvidence(snapshot)},${auth.principal.userId})`);
  return ok(request, { baselineId, contentHash: hashEvidence(snapshot), immutable: true }, 201);
}
