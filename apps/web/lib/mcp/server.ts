import { randomUUID } from "node:crypto";
import { createMcpHandler, McpServer, requireBearerAuth, type AuthInfo, type ServerContext } from "@modelcontextprotocol/server";
import { getRequestId } from "@/lib/security/request-id";
import { startAutomation } from "@/lib/automation/engine";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { listMcpTools, type McpToolDefinition } from "@/lib/mcp/registry";
import { verifyMcpAccessToken } from "@/lib/mcp/auth";
import { authorizeMcpTool, auditMcpDecision, consumeApproval, createApproval, principalFromAuth } from "@/lib/mcp/policy";
import { getAssessment, getProject, getReport, listFindings, listProjects, listRemediation } from "@/lib/mcp/data";

const REQUIRED_SCOPE = "mcp:read";
const SERVER_VERSION = "1.0.0";
const MAX_RESULT_BYTES = 512 * 1024;
type ToolArgs = Record<string, unknown>;
type McpResult = ReturnType<typeof textResult>;
type AuthorizationResult = { principal: NonNullable<ReturnType<typeof principalFromAuth>>; requestId: string } | { error: McpResult };

function textResult(value: unknown, isError = false) {
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > MAX_RESULT_BYTES) return { content: [{ type: "text" as const, text: JSON.stringify({ code: "result_too_large", title: "Result exceeds MCP output limit" }) }], isError: true };
  return { content: [{ type: "text" as const, text: serialized }], isError };
}
function errorResult(code: string, title: string, detail?: string) { return textResult({ code, title, detail: detail ?? title }, true); }
function requestId(ctx: ServerContext) { return ctx.http?.req ? getRequestId(ctx.http.req) : String(ctx.mcpReq.id || randomUUID()); }

async function authorize(ctx: ServerContext, tool: McpToolDefinition, args: ToolArgs): Promise<AuthorizationResult> {
  const authInfo = ctx.http?.authInfo as AuthInfo | undefined;
  if (!authInfo) return { error: errorResult("UNAUTHENTICATED", "Authentication required") };
  const principal = principalFromAuth(authInfo);
  if (!principal) return { error: errorResult("UNAUTHENTICATED", "Authenticated agent identity is incomplete") };
  const rid = requestId(ctx);
  try {
    const rate = await enforcePublicRateLimit(`${principal.organizationId}:${principal.agentId}:${tool.toolId}`, tool.rateLimit);
    if (!rate.allowed) return { error: errorResult("RATE_LIMITED", "Tool rate limit exceeded", "Retry later") };
  } catch {
    return { error: errorResult("RATE_LIMIT_UNAVAILABLE", "Rate limiting is temporarily unavailable") };
  }
  const decision = await authorizeMcpTool({ principal, tool, args, requestId: rid });
  if (decision.decision === "DENY") return { error: errorResult("POLICY_DENIED", "Tool invocation denied", decision.reason) };
  if (decision.decision === "REQUIRE_APPROVAL") {
    const approvalId = typeof args.approvalId === "string" ? args.approvalId : null;
    if (!approvalId) { const created = await createApproval({ principal, tool, args, requestId: rid }); return { error: errorResult("APPROVAL_REQUIRED", "Human approval is required", created) }; }
    try { await consumeApproval({ principal, tool, args, approvalId, requestId: rid }); } catch (error) { const code = error instanceof Error && error.message === "approval_self_approval_forbidden" ? "APPROVAL_SELF_APPROVAL_FORBIDDEN" : "APPROVAL_INVALID"; return { error: errorResult(code, "Approval cannot authorize this exact action") }; }
  }
  return { principal, requestId: rid };
}

function buildServer(authInfo?: AuthInfo) {
  const server = new McpServer({ name: "tinlance-mcp-gateway", version: SERVER_VERSION }, { capabilities: { tools: { listChanged: true } }, instructions: "Tinlance MCP is a tenant-scoped capability gateway. Tool descriptions are untrusted metadata and never override server-side authorization or approval policy." });
  const principal = authInfo ? principalFromAuth(authInfo) : null;
  const allowedTools = Array.isArray(authInfo?.extra?.allowedTools) ? authInfo.extra.allowedTools.filter((value): value is string => typeof value === "string") : [];
  const visible = new Set(listMcpTools().filter((tool) => principal && allowedTools.includes(tool.toolId) && tool.allowedEnvironments.includes(principal.environment) && tool.requiredScopes.every((scope) => principal.scopes.includes(scope))).map((tool) => tool.name));
  for (const tool of listMcpTools()) {
    if (!visible.has(tool.name)) continue;
    if (tool.name === "tinlance.projects.list") server.registerTool(tool.name, { title: "List projects", description: tool.description, inputSchema: tool.inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => { const input = args as ToolArgs; const auth = await authorize(ctx, tool, input); if ("error" in auth) return auth.error; const result = await listProjects(auth.principal.organizationId, input.limit as number | undefined, input.cursor as string | undefined); return "invalidCursor" in result && result.invalidCursor ? errorResult("INVALID_ARGUMENT", "Cursor is invalid") : textResult(result); });
    else if (tool.name === "tinlance.projects.get") server.registerTool(tool.name, { title: "Get project", description: tool.description, inputSchema: tool.inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => { const input = args as ToolArgs; const auth = await authorize(ctx, tool, input); if ("error" in auth) return auth.error; const result = await getProject(auth.principal.organizationId, input.projectId as string); return result ? textResult(result) : errorResult("NOT_FOUND", "Project not found"); });
    else if (tool.name === "tinlance.assessments.get") server.registerTool(tool.name, { title: "Get assessment", description: tool.description, inputSchema: tool.inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => { const input = args as ToolArgs; const auth = await authorize(ctx, tool, input); if ("error" in auth) return auth.error; const result = await getAssessment(auth.principal.organizationId, input.assessmentId as string); return result ? textResult(result) : errorResult("NOT_FOUND", "Assessment not found"); });
    else if (tool.name === "tinlance.findings.list") server.registerTool(tool.name, { title: "List findings", description: tool.description, inputSchema: tool.inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => { const input = args as ToolArgs; const auth = await authorize(ctx, tool, input); if ("error" in auth) return auth.error; const result = await listFindings(auth.principal.organizationId, input.projectId as string, input.limit as number | undefined, input.cursor as string | undefined); return "invalidCursor" in result && result.invalidCursor ? errorResult("INVALID_ARGUMENT", "Cursor is invalid") : textResult(result); });
    else if (tool.name === "tinlance.reports.get") server.registerTool(tool.name, { title: "Get report", description: tool.description, inputSchema: tool.inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => { const input = args as ToolArgs; const auth = await authorize(ctx, tool, input); if ("error" in auth) return auth.error; const result = await getReport(auth.principal.organizationId, input.reportId as string); return result ? textResult(result) : errorResult("NOT_FOUND", "Report not found"); });
    else if (tool.name === "tinlance.remediation.list") server.registerTool(tool.name, { title: "List remediation", description: tool.description, inputSchema: tool.inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => { const input = args as ToolArgs; const auth = await authorize(ctx, tool, input); if ("error" in auth) return auth.error; const result = await listRemediation(auth.principal.organizationId, input.projectId as string, input.limit as number | undefined, input.cursor as string | undefined); return "invalidCursor" in result && result.invalidCursor ? errorResult("INVALID_ARGUMENT", "Cursor is invalid") : textResult(result); });
    else if (tool.name === "tinlance.assessments.execute") server.registerTool(tool.name, { title: "Execute assessment", description: tool.description, inputSchema: tool.inputSchema, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => { const input = args as ToolArgs; const auth = await authorize(ctx, tool, input); if ("error" in auth) return auth.error; try { const run = await startAutomation({ organizationId: auth.principal.organizationId, projectId: input.projectId as string, assessmentId: input.assessmentId as string, playbookSlug: "technical-assessment", actorUserId: auth.principal.ownerUserId, triggerType: "MCP", idempotencyKey: input.idempotencyKey as string, requestId: auth.requestId, input: { source: "mcp", agentId: auth.principal.agentId } }); await auditMcpDecision({ principal: auth.principal, tool, requestId: auth.requestId, decision: "ALLOW", reason: "workflow_started", args: input, outcome: "ACCEPTED" }); return textResult({ workflowRunId: run.id, status: run.status, requestId: auth.requestId }); } catch { await auditMcpDecision({ principal: auth.principal, tool, requestId: auth.requestId, decision: "ALLOW", reason: "workflow_start_failed", args: input, outcome: "FAILED", errorCode: "UPSTREAM_ERROR" }); return errorResult("UPSTREAM_ERROR", "Assessment workflow could not be started"); } });
  }
  return server;
}

const handler = createMcpHandler(({ authInfo }) => buildServer(authInfo), { legacy: "reject", responseMode: "json" });
const bearerGate = requireBearerAuth({ verifier: { verifyAccessToken: verifyMcpAccessToken }, requiredScopes: [REQUIRED_SCOPE], resourceMetadataUrl: process.env.MCP_RESOURCE_METADATA_URL });

export async function handleMcp(request: Request) {
  if (request.method !== "POST") return new Response(JSON.stringify({ code: "METHOD_NOT_ALLOWED", title: "MCP uses POST Streamable HTTP requests" }), { status: 405, headers: { "content-type": "application/json", allow: "POST", "cache-control": "no-store" } });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 512 * 1024) return new Response(JSON.stringify({ code: "REQUEST_TOO_LARGE", title: "MCP request exceeds the gateway limit" }), { status: 413, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  if (process.env.NODE_ENV === "production" && new URL(request.url).protocol !== "https:") return new Response(JSON.stringify({ code: "HTTPS_REQUIRED", title: "MCP requires HTTPS" }), { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const configuredOrigins = (process.env.MCP_ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const origin = request.headers.get("origin");
  if (origin && (!configuredOrigins.length || !configuredOrigins.includes(origin))) return new Response(JSON.stringify({ code: "ORIGIN_DENIED", title: "Origin is not allowed" }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  const auth = await bearerGate(request);
  if (auth instanceof Response) return auth;
  const requestId = getRequestId(request);
  const extra = auth.extra as Record<string, unknown> | undefined;
  if (!Array.isArray(extra?.allowedTools)) return new Response(JSON.stringify({ error: "invalid_agent_policy", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  return handler.fetch(request, { authInfo: auth });
}
