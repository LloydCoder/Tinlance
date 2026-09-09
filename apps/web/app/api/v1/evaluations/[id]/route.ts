import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { authorizeEvaluation } from "@/lib/evaluation/store";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const requestId = getRequestId(request);
  const decision = await authorizeEvaluation({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, permission: "evaluation:read", action: "evaluation.read", resourceType: "EvaluationRun", resourceId: id, requestId });
  if (decision.decision !== "ALLOW") return problem(requestId, 403, "evaluation_authorization_denied", "Evaluation access denied");
  const runs = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,"targetId","targetVersion","suiteId","suiteVersion","datasetSlug","datasetVersion","graderVersion",environment,"commitSha",model,"configurationHash",status,"startedAt","completedAt",summary FROM "EvaluationRun" WHERE id=${id} AND "organizationId"=${auth.principal.organizationId} LIMIT 1`);
  if (!runs[0]) return problem(requestId, 404, "evaluation_not_found", "Evaluation not found");
  const results = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT "caseId",attempt,status,classification,score,severity,reason,evidence,"traceId","createdAt" FROM "EvaluationResult" WHERE "runId"=${id} AND "organizationId"=${auth.principal.organizationId} ORDER BY "createdAt"`);
  const findings = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,category,severity,confidence,description,"attackCase","affectedVersion",status,evidence,"firstSeen","lastSeen" FROM "EvaluationFinding" WHERE "runId"=${id} AND "organizationId"=${auth.principal.organizationId} ORDER BY "firstSeen"`);
  return ok(request, { ...runs[0], results, findings });
}
