import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";
import { authorizeAgentManagement } from "@/lib/agent-runtime/authorization";
import { cancelExecution, executeOnce, getExecution } from "@/lib/agent-runtime/store";

export async function GET(request: Request, context: { params: Promise<{ executionId: string }> }) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const { executionId } = await context.params;
  const execution = await getExecution(auth.principal.organizationId, executionId); if (!execution) return problem(requestId, 404, "execution_not_found", "Execution not found");
  if (execution.principalId !== auth.principal.userId) { const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.execution.read", resourceId: executionId, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "execution_authorization_denied", "Execution access denied"); }
  return ok(request, execution);
}

export async function POST(request: Request, context: { params: Promise<{ executionId: string }> }) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const { executionId } = await context.params; const body = await request.json().catch(() => ({})) as { action?: string; approvalId?: string };
  const execution = await getExecution(auth.principal.organizationId, executionId); if (!execution) return problem(requestId, 404, "execution_not_found", "Execution not found");
  if (execution.principalId !== auth.principal.userId) { const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.execution.manage", resourceId: executionId, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "execution_authorization_denied", "Execution control denied"); }
  try {
    if (body.action === "cancel") return ok(request, { status: await cancelExecution({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, executionId }) });
    if (body.action === "run" || body.action === "resume") return ok(request, { status: await executeOnce({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, executionId, approvalId: body.approvalId }) });
    return problem(requestId, 400, "invalid_execution_action", "Supported actions are run, resume and cancel");
  } catch (error) { return problem(requestId, 409, "execution_control_failed", "Execution control failed", error instanceof Error ? error.message : "Unknown error"); }
}
