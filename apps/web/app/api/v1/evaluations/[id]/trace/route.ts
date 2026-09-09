import { z } from "zod";
import { getRequestId } from "@/lib/security/request-id";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { authorizeEvaluation, recordTrace } from "@/lib/evaluation/store";

const schema = z.object({ spanType: z.string().min(1).max(80), name: z.string().min(1).max(200), parentSpanId: z.string().max(128).optional(), metadata: z.record(z.string(), z.unknown()).default({}), request: z.unknown().optional(), response: z.unknown().optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const requestId = getRequestId(request);
  const decision = await authorizeEvaluation({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, permission: "evaluation:execute", action: "evaluation.trace.write", resourceType: "EvaluationRun", resourceId: id, requestId });
  if (decision.decision !== "ALLOW") return problem(requestId, 403, "evaluation_authorization_denied", "Trace ingestion denied");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return problem(requestId, 400, "invalid_trace", "Invalid trace", parsed.error.message);
  try {
    const trace = await recordTrace({ organizationId: auth.principal.organizationId, runId: id, ...parsed.data });
    return ok(request, { traceId: trace.traceId, spanId: trace.id, inputHash: trace.inputHash, outputHash: trace.outputHash });
  } catch (error) {
    return problem(requestId, 404, "trace_ingestion_failed", "Trace could not be recorded", error instanceof Error ? error.message : "Unknown trace error");
  }
}
