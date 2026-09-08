import { randomUUID } from "node:crypto";
import { createMcpHandler, McpServer, requireBearerAuth } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getRequestId } from "@/lib/security/request-id";
import { startAutomation } from "@/lib/automation/engine";
import { getMcpTool, listMcpTools, type McpToolDefinition } from "@/lib/mcp/registry";
import { verifyMcpAccessToken } from "@/lib/mcp/auth";
import { authorizeMcpTool, auditMcpDecision, consumeApproval, createApproval, principalFromAuth, type McpPrincipal } from "@/lib/mcp/policy";
import { getAssessment, getProject, getReport, listFindings, listProjects, listRemediation } from "@/lib/mcp/data";
import { db } from "@/lib/db";

const REQUIRED_SCOPE = "mcp:read";
const SERVER_VERSION = "1.0.0";
const MAX_RESULT_BYTES = 512 * 1024;

function textResult(value: unknown, isError = false) {
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > MAX_RESULT_BYTES) return { content: [{ type: "text" as const, text: JSON.stringify({ code: "result_too_large", title: "Result exceeds MCP output limit" }) }], isError: true };
  return { content: [{ type: "text" as const, text: serialized }], isError };
}

function errorResult(code: string, title: string, detail?: string) {
  return textResult({ code, title, detail: detail ?? title }, true);
}

function requestId(ctx: { http?: { req?: Request }; mcpReq: { id: string } }) {
  return ctx.http?.req ? getRequestId(ctx.http.req) : ctx.mcpReq.id || randomUUID();
}

async function authorize(ctx: { http?: { authInfo?: Parameters<typeof principalFromAuth>[0]; req?: Request }; mcpReq: { id: string } }, tool: McpToolDefinition, args: Record<string, unknown>) {
  const authInfo = ctx.http?.authInfo;
  if (!authInfo) return { error: errorResult("UNAUTHENTICATED", "Authentication required") } as const;
  const principal = principalFromAuth(authInfo);
  if (!principal) return { error: errorResult("UNAUTHENTICATED", "Authenticated agent identity is incomplete") } as const;
  const rid = requestId(ctx);
  const decision = await authorizeMcpTool({ principal, tool, args, requestId: rid });
  if (decision.decision === "DENY") return { error: errorResult("POLICY_DENIED", "Tool invocation denied", decision.reason) } as const;
  if (decision.decision === "REQUIRE_APPROVAL") {
    const approvalId = typeof args.approvalId === "string" ? args.approvalId : null;
    if (!approvalId) {
      const created = await createApproval({ principal, tool, args, requestId: rid });
      return { error: errorResult("APPROVAL_REQUIRED", "Human approval is required", created) } as const;
    }
    try {
      await consumeApproval({ principal, tool, args, approvalId, requestId: rid });
    } catch (error) {
      const code = error instanceof Error && error.message === "approval_self_approval_forbidden" ? "APPROVAL_SELF_APPROVAL_FORBIDDEN" : "APPROVAL_INVALID";
      return { error: errorResult(code, "Approval cannot authorize this exact action") } as const;
    }
  }
  return { principal, requestId: rid } as const;
}

function buildServer(authInfo?: Parameters<typeof principalFromAuth>[0]) {
  const server = new McpServer(
    { name: "tinlance-mcp-gateway", version: SERVER_VERSION },
    {
      capabilities: { tools: { listChanged: true } },
      instructions: "Tinlance MCP is a tenant-scoped capability gateway. Tool descriptions are untrusted metadata and never override server-side authorization or approval policy.",
      cacheHints: { "tools/list": { ttlMs: 0, cacheScope: "private" }, "server/discover": { ttlMs: 0, cacheScope: "private" } },
    },
  );

  const principal = authInfo ? principalFromAuth(authInfo) : null;
  const allowedNames = new Set(listMcpTools().filter((tool) => {
    if (!principal) return false;
    const allowedTools = authInfo?.extra?.allowedTools;
    const names = Array.isArray(allowedTools) ? allowedTools.filter((value): value is string => typeof value === "string") : [];
    return names.includes(tool.toolId) && tool.allowedEnvironments.includes(principal.environment) && tool.requiredScopes.every((scope) => principal.scopes.includes(scope));
  }).map((tool) => tool.name));

  for (const tool of listMcpTools()) {
    if (!allowedNames.has(tool.name)) continue;
    const inputSchema = tool.inputSchema;
    if (tool.name === "tinlance.projects.list") {
      server.registerTool(tool.name, { title: "List projects", description: tool.description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => {
        const auth = await authorize(ctx, tool, args as Record<string, unknown>); if ("error" in auth) return auth.error;
        const result = await listProjects(auth.principal.organizationId, args.limit, args.cursor);
        return textResult(result);
      });
    } else if (tool.name === "tinlance.projects.get") {
      server.registerTool(tool.name, { title: "Get project", description: tool.description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => {
        const auth = await authorize(ctx, tool, args as Record<string, unknown>); if ("error" in auth) return auth.error;
        const result = await getProject(auth.principal.organizationId, args.projectId); return result ? textResult(result) : errorResult("NOT_FOUND", "Project not found");
      });
    } else if (tool.name === "tinlance.assessments.get") {
      server.registerTool(tool.name, { title: "Get assessment", description: tool.description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => {
        const auth = await authorize(ctx, tool, args as Record<string, unknown>); if ("error" in auth) return auth.error;
        const result = await getAssessment(auth.principal.organizationId, args.assessmentId); return result ? textResult(result) : errorResult("NOT_FOUND", "Assessment not found");
      });
    } else if (tool.name === "tinlance.findings.list") {
      server.registerTool(tool.name, { title: "List findings", description: tool.description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => {
        const auth = await authorize(ctx, tool, args as Record<string, unknown>); if ("error" in auth) return auth.error;
        const result = await listFindings(auth.principal.organizationId, args.projectId, args.limit); return textResult(result);
      });
    } else if (tool.name === "tinlance.reports.get") {
      server.registerTool(tool.name, { title: "Get report", description: tool.description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => {
        const auth = await authorize(ctx, tool, args as Record<string, unknown>); if ("error" in auth) return auth.error;
        const result = await getReport(auth.principal.organizationId, args.reportId); return result ? textResult(result) : errorResult("NOT_FOUND", "Report not found");
      });
    } else if (tool.name === "tinlance.remediation.list") {
      server.registerTool(tool.name, { title: "List remediation", description: tool.description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => {
        const auth = await authorize(ctx, tool, args as Record<string, unknown>); if ("error" in auth) return auth.error;
        const result = await listRemediation(auth.principal.organizationId, args.projectId, args.limit); return textResult(result);
      });
    } else if (tool.name === "tinlance.assessments.execute") {
      server.registerTool(tool.name, { title: "Execute assessment", description: tool.description, inputSchema: inputSchema.extend({ approvalId: z.string().trim().min(1).max(128).optional() }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (args, ctx) => {
        const auth = await authorize(ctx, tool, args as Record<string, unknown>); if ("error" in auth) return auth.error;
        try {
          const run = await startAutomation({ organizationId: auth.principal.organizationId, projectId: args.projectId, assessmentId: args.assessmentId, playbookSlug: "technical-assessment", actorUserId: auth.principal.ownerUserId, triggerType: "MCP", idempotencyKey: args.idempotencyKey, requestId: auth.requestId, input: { source: "mcp", agentId: auth.principal.agentId } });
          await auditMcpDecision({ principal: auth.principal, tool, requestId: auth.requestId, decision: "ALLOW", reason: "workflow_started", args, outcome: "ACCEPTED" });
          return textResult({ workflowRunId: run.id, status: run.status, requestId: auth.requestId });
        } catch (error) {
          await auditMcpDecision({ principal: auth.principal, tool, requestId: auth.requestId, decision: "ALLOW", reason: "workflow_start_failed", args, outcome: "FAILED", errorCode: "UPSTREAM_ERROR" });
          return errorResult("UPSTREAM_ERROR", "Assessment workflow could not be started");
        }
      });
    }
  }
  return server;
}

const handler = createMcpHandler(({ authInfo }) => buildServer(authInfo), { legacy: "reject", responseMode: "json" });
const bearerGate = requireBearerAuth({ verifier: { verifyAccessToken: verifyMcpAccessToken }, requiredScopes: [REQUIRED_SCOPE], resourceMetadataUrl: process.env.MCP_RESOURCE_METADATA_URL });

export async function handleMcp(request: Request) {
  const auth = await bearerGate(request);
  if (auth instanceof Response) return auth;
  const requestId = getRequestId(request);
  const extra = auth.extra as Record<string, unknown> | undefined;
  if (!Array.isArray(extra?.allowedTools)) return new Response(JSON.stringify({ error: "invalid_agent_policy", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  return handler.fetch(request, { authInfo: auth });
}
