import { z } from "zod";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";
import { authorizeAgentManagement } from "@/lib/agent-runtime/authorization";
import { startExecution } from "@/lib/agent-runtime/store";

const schema = z.object({ task: z.string().trim().min(1).max(20000), idempotencyKey: z.string().trim().min(8).max(255), version: z.number().int().positive().optional(), budget: z.record(z.string(), z.number().nonnegative()).optional() });

export async function POST(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const { agentId } = await context.params; const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return problem(requestId, 400, "invalid_execution_request", "Invalid execution request", parsed.error.message);
  const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.execute", resourceId: agentId, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "agent_authorization_denied", "Agent execution denied");
  try { const execution = await startExecution({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, agentId, ...parsed.data }); return ok(request, execution, 202); } catch (error) { return problem(requestId, 422, "agent_execution_start_failed", "Agent execution could not be started", error instanceof Error ? error.message : "Unknown execution error"); }
}
