import { z } from "zod";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";
import { createAgentVersion, getAgentDetails, setAgentStatus } from "@/lib/agent-runtime/store";
import { authorizeAgentManagement } from "@/lib/agent-runtime/authorization";

const versionSchema = z.object({
  instructions: z.string().trim().min(1).max(20000),
  modelProvider: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(200),
  capabilities: z.array(z.object({ toolId: z.string().trim().min(1).max(128), action: z.string().trim().min(1).max(200), resource: z.string().trim().max(200).optional(), projectId: z.string().trim().max(200).optional(), environment: z.string().trim().max(50).optional(), classification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE", "RESTRICTED"]).optional(), expiresAt: z.string().datetime().optional(), rateLimit: z.number().int().positive().max(10000).optional() })).max(32),
  memoryPolicy: z.record(z.string(), z.unknown()).default({}),
  executionPolicy: z.record(z.string(), z.number().nonnegative()).default({}),
  riskPolicy: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const { agentId } = await context.params;
  const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.read", resourceId: agentId, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "agent_authorization_denied", "Agent access denied");
  const agent = await getAgentDetails(auth.principal.organizationId, agentId); if (!agent) return problem(requestId, 404, "agent_not_found", "Agent not found"); return ok(request, agent);
}

export async function PATCH(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const { agentId } = await context.params; const body = await request.json().catch(() => null) as { status?: string } | null;
  if (!body?.status || !["DRAFT", "ACTIVE", "PAUSED", "REVOKED", "ARCHIVED"].includes(body.status)) return problem(requestId, 400, "invalid_agent_status", "Invalid agent lifecycle status");
  const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: `agent.${body.status.toLowerCase()}`, resourceId: agentId, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "agent_authorization_denied", "Agent lifecycle change denied");
  try { await setAgentStatus({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, agentId, status: body.status as "DRAFT" | "ACTIVE" | "PAUSED" | "REVOKED" | "ARCHIVED" }); return ok(request, { id: agentId, status: body.status }); } catch (error) { return problem(requestId, 409, "agent_status_change_failed", "Agent lifecycle transition failed", error instanceof Error ? error.message : "Unknown error"); }
}

export async function POST(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const { agentId } = await context.params; const parsed = versionSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return problem(requestId, 400, "invalid_agent_version", "Invalid agent version", parsed.error.message);
  const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.version.create", resourceId: agentId, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "agent_authorization_denied", "Agent version creation denied");
  try { const version = await createAgentVersion({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, agentId, ...parsed.data }); return ok(request, version, 201); } catch (error) { return problem(requestId, 422, "agent_version_creation_failed", "Agent version could not be created", error instanceof Error ? error.message : "Unknown error"); }
}
