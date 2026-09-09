import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { authorizeEvaluation } from "@/lib/evaluation/store";
import { validateRedTeamScope } from "@/lib/evaluation";

const schema = z.object({
  targetId: z.string().min(1),
  name: z.string().min(1).max(200),
  environment: z.enum(["sandbox","staging","production"]),
  scope: z.object({ production: z.boolean().default(false), arbitraryInternet: z.boolean().default(false), allowedHosts: z.array(z.string().max(255)).max(50).default([]), allowedTools: z.array(z.string().max(200)).max(100).default([]) }),
  attackProfile: z.object({ techniques: z.array(z.string().max(100)).min(1).max(50), adaptive: z.boolean().default(false) }),
  authorization: z.object({ explicit: z.boolean(), operator: z.string().min(1), expiresAt: z.string().datetime() }),
  limits: z.object({ maxRequests: z.number().int().min(1).max(10000), maxDurationSeconds: z.number().int().min(1).max(86400), maxCostMinor: z.number().int().min(0).max(1000000).default(0) }),
});

export async function POST(request: Request) {
  const auth = await authenticateApi(request);
  if ("response" in auth) return auth.response;
  const requestId = getRequestId(request);
  const decision = await authorizeEvaluation({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, permission: "evaluation:manage", action: "redteam.create", resourceType: "RedTeamCampaign", requestId });
  if (decision.decision !== "ALLOW") return problem(requestId, 403, "redteam_authorization_denied", "Red-team authorization denied");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return problem(requestId, 400, "invalid_redteam_request", "Invalid red-team campaign", parsed.error.message);
  const body = parsed.data;
  try {
    validateRedTeamScope(body);
    const target = await db.$queryRaw<Array<{ id: string; environment: string }>>(Prisma.sql`SELECT id,environment FROM "EvaluationTarget" WHERE id=${body.targetId} AND "organizationId"=${auth.principal.organizationId} LIMIT 1`);
    if (!target[0]) return problem(requestId, 404, "evaluation_target_not_found", "Evaluation target not found");
    if (target[0].environment !== body.environment) return problem(requestId, 400, "redteam_environment_mismatch", "Campaign environment does not match target");
    if (new Date(body.authorization.expiresAt) <= new Date()) return problem(requestId, 400, "redteam_authorization_expired", "Authorization has expired");
    const id = crypto.randomUUID();
    await db.$executeRaw(Prisma.sql`INSERT INTO "RedTeamCampaign" ("id","organizationId","targetId","name","status","scope","attackProfile","authorization","limits","operatorUserId","approvedByUserId") VALUES (${id},${auth.principal.organizationId},${body.targetId},${body.name},'APPROVED',${JSON.stringify(body.scope)}::jsonb,${JSON.stringify(body.attackProfile)}::jsonb,${JSON.stringify(body.authorization)}::jsonb,${JSON.stringify(body.limits)}::jsonb,${auth.principal.userId},${auth.principal.userId})`);
    return ok(request, { campaignId: id, status: "APPROVED", execution: "CONTROLLED_ONLY" }, 201);
  } catch (error) {
    return problem(requestId, 422, "redteam_scope_rejected", "Red-team scope rejected", error instanceof Error ? error.message : "Invalid scope");
  }
}
