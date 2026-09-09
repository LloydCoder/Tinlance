import { z } from "zod";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";
import { createAgent, listAgents } from "@/lib/agent-runtime/store";
import { authorizeAgentManagement } from "@/lib/agent-runtime/authorization";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  environment: z.enum(["production", "staging", "development"]),
  expiresAt: z.string().datetime(),
  instructions: z.string().trim().min(1).max(20000),
  modelProvider: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(200),
  capabilities: z.array(z.object({
    toolId: z.string().trim().min(1).max(128),
    action: z.string().trim().min(1).max(200),
    resource: z.string().trim().max(200).optional(),
    projectId: z.string().trim().max(200).optional(),
    environment: z.string().trim().max(50).optional(),
    classification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE", "RESTRICTED"]).optional(),
    expiresAt: z.string().datetime().optional(),
    rateLimit: z.number().int().positive().max(10000).optional(),
  })).max(32),
  memoryPolicy: z.record(z.string(), z.unknown()).default({}),
  executionPolicy: z.record(z.string(), z.number().nonnegative()).default({}),
  riskPolicy: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(request: Request) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request);
  const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.list", resourceId: undefined, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "agent_authorization_denied", "Agent access denied");
  return ok(request, { agents: await listAgents(auth.principal.organizationId) });
}

export async function POST(request: Request) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return problem(requestId, 400, "invalid_agent_request", "Invalid agent configuration", parsed.error.message);
  const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.create", resourceId: undefined, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "agent_authorization_denied", "Agent creation denied");
  try { const result = await createAgent({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, ...parsed.data, expiresAt: new Date(parsed.data.expiresAt) }); return ok(request, result, 201); } catch (error) { return problem(requestId, 422, "agent_creation_failed", "Agent could not be created", error instanceof Error ? error.message : "Unknown agent error"); }
}
