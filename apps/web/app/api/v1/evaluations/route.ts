import { z } from "zod";
import { getRequestId } from "@/lib/security/request-id";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { authorizeEvaluation, createEvaluationProject, createTarget, listCases, startRun, recordResult, completeRun } from "@/lib/evaluation/store";

const createSchema = z.object({
  project: z.object({ name: z.string().min(1).max(200), description: z.string().max(2000).optional() }).optional(),
  projectId: z.string().min(1).optional(),
  assessmentId: z.string().min(1).optional(),
  target: z.object({ name: z.string().min(1).max(200), targetType: z.string().min(1).max(80), version: z.string().min(1).max(120), environment: z.enum(["sandbox","staging","production"]).default("sandbox"), metadata: z.record(z.string(), z.unknown()).default({}) }),
  suiteId: z.string().min(1).default("m8-suite-production-security-v1"),
  suiteVersion: z.string().default("1"),
  datasetSlug: z.string().default("m8-security"),
  datasetVersion: z.string().default("1"),
  profile: z.enum(["DEVELOPMENT","PULL_REQUEST","CI","PRE_PRODUCTION","PRODUCTION","SCHEDULED","CUSTOMER_ASSESSMENT","RED_TEAM"]).default("PULL_REQUEST"),
  commitSha: z.string().regex(/^[0-9a-f]{7,64}$/i).optional(),
  model: z.string().max(200).optional(),
  executions: z.record(z.string(), z.object({ decision: z.string().optional(), toolCalled: z.boolean().optional(), toolName: z.string().optional(), output: z.unknown().optional(), externalRequest: z.object({ attempted: z.boolean(), destination: z.string().optional() }).optional(), tenantId: z.string().optional(), principalTenantId: z.string().optional(), approvalPresent: z.boolean().optional(), m7Decision: z.string().optional(), policyVersion: z.string().optional(), durationMs: z.number().nonnegative().optional(), tokenUsage: z.number().nonnegative().optional(), costMinor: z.number().nonnegative().optional() })).default({}),
});

export async function GET(request: Request) {
  const auth = await authenticateApi(request);
  if ("response" in auth) return auth.response;
  const requestId = getRequestId(request);
  const decision = await authorizeEvaluation({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, permission: "evaluation:read", action: "evaluation.list", resourceType: "Evaluation", requestId });
  if (decision.decision !== "ALLOW") return problem(requestId, 403, "evaluation_authorization_denied", "Evaluation access denied");
  const cases = await listCases(auth.principal.organizationId);
  return ok(request, { dataset: { slug: "m8-security", version: "1", caseCount: cases.length }, cases: cases.map(({ id, category, subcategory, scenario, severity, attackTechnique, grader }) => ({ id, category, subcategory, scenario, severity, attackTechnique, grader })) });
}

export async function POST(request: Request) {
  const auth = await authenticateApi(request);
  if ("response" in auth) return auth.response;
  const requestId = getRequestId(request);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return problem(requestId, 400, "invalid_evaluation_request", "Invalid evaluation request", parsed.error.message);
  const body = parsed.data;
  const decision = await authorizeEvaluation({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, permission: "evaluation:execute", action: "evaluation.execute", resourceType: "Evaluation", requestId });
  if (decision.decision !== "ALLOW") return problem(requestId, 403, "evaluation_authorization_denied", "Evaluation execution denied");
  try {
    const projectId = body.projectId ?? (body.project ? await createEvaluationProject({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, ...body.project }) : null);
    if (!projectId) return problem(requestId, 400, "evaluation_project_required", "projectId or project is required");
    const targetId = await createTarget({ organizationId: auth.principal.organizationId, projectId, userId: auth.principal.userId, ...body.target });
    const runId = await startRun({ organizationId: auth.principal.organizationId, projectId, assessmentId: body.assessmentId, targetId, suiteId: body.suiteId, suiteVersion: body.suiteVersion, datasetSlug: body.datasetSlug, datasetVersion: body.datasetVersion, profile: body.profile, userId: auth.principal.userId, commitSha: body.commitSha, model: body.model });
    const cases = await listCases(auth.principal.organizationId, body.datasetSlug, body.datasetVersion);
    const selected = body.profile === "DEVELOPMENT" ? cases.slice(0, 6) : cases;
    const missing = selected.filter((testCase) => !body.executions[testCase.id]).map((testCase) => testCase.id);
    if (missing.length) return problem(requestId, 422, "evaluation_execution_incomplete", "Evaluation evidence is incomplete", `Missing executions for ${missing.length} required cases.`);
    for (const testCase of selected) await recordResult({ organizationId: auth.principal.organizationId, runId, testCase, execution: body.executions[testCase.id] });
    const gate = await completeRun({ organizationId: auth.principal.organizationId, runId });
    return ok(request, { runId, targetId, projectId, suite: body.suiteId, dataset: `${body.datasetSlug}@${body.datasetVersion}`, gate }, 201);
  } catch (error) {
    return problem(requestId, 422, "evaluation_execution_failed", "Evaluation could not be executed", error instanceof Error ? error.message : "Unknown evaluation error");
  }
}
