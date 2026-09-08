import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { generateMcpToken, mcpTokenHash, mcpTokenPrefix, validateAgentExpiry } from "@/lib/mcp/auth";
import { listMcpTools } from "@/lib/mcp/registry";
import { getRequestId } from "@/lib/security/request-id";

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  clientId: z.string().trim().min(3).max(100).regex(/^[A-Za-z0-9._:-]+$/),
  description: z.string().trim().max(1000).optional(),
  environment: z.enum(["production", "staging", "development"]).default("production"),
  expiresAt: z.string().datetime(),
  scopes: z.array(z.string().trim().min(1).max(100)).min(1).max(32),
  allowedTools: z.array(z.string().trim().min(1).max(100)).min(1).max(32),
});

const PUBLIC_AGENT_SCOPES = new Set(["mcp:read", "mcp:write", "projects:read", "assessments:read", "assessments:execute", "findings:read", "reports:read", "remediation:read"]);

export async function GET(request: Request) {
  const principal = await getWorkspacePrincipal();
  const requestId = getRequestId(request);
  if (!principal || !hasWorkspacePermission(principal, "workspace:manage")) return new Response(JSON.stringify({ code: "FORBIDDEN", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const rows = await db.$queryRaw<Array<{ id: string; clientId: string; name: string; description: string | null; status: string; environment: string; scopes: unknown; allowedTools: unknown; expiresAt: Date | null; lastUsedAt: Date | null; revokedAt: Date | null; createdAt: Date }>>(Prisma.sql`SELECT "id","clientId","name","description","status","environment","scopes","allowedTools","expiresAt","lastUsedAt","revokedAt","createdAt" FROM "McpAgent" WHERE "organizationId"=${principal.organizationId} ORDER BY "createdAt" DESC`);
  return new Response(JSON.stringify({ data: rows.map((row) => ({ ...row, expiresAt: row.expiresAt?.toISOString() ?? null, lastUsedAt: row.lastUsedAt?.toISOString() ?? null, revokedAt: row.revokedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() })), requestId }), { status: 200, headers: { "content-type": "application/json", "cache-control": "private, no-store", "x-request-id": requestId } });
}

export async function POST(request: Request) {
  const principal = await getWorkspacePrincipal();
  const requestId = getRequestId(request);
  if (!principal || !hasWorkspacePermission(principal, "workspace:manage")) return new Response(JSON.stringify({ code: "FORBIDDEN", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ code: "INVALID_ARGUMENT", requestId }), { status: 422, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const input = parsed.data;
  const expiresAt = new Date(input.expiresAt);
  try { validateAgentExpiry(expiresAt); } catch { return new Response(JSON.stringify({ code: "INVALID_ARGUMENT", detail: "Agent credentials may expire no more than 90 days after creation", requestId }), { status: 422, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } }); }
  if (input.scopes.some((scope) => !PUBLIC_AGENT_SCOPES.has(scope))) return new Response(JSON.stringify({ code: "INVALID_ARGUMENT", detail: "Unsupported MCP agent scope", requestId }), { status: 422, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const registry = listMcpTools();
  const selected = input.allowedTools.map((toolId) => registry.find((tool) => tool.toolId === toolId));
  if (selected.some((tool) => !tool)) return new Response(JSON.stringify({ code: "INVALID_ARGUMENT", detail: "Agent requested an unknown tool", requestId }), { status: 422, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  if (selected.some((tool) => tool!.requiredScopes.some((scope) => !input.scopes.includes(scope)))) return new Response(JSON.stringify({ code: "INVALID_ARGUMENT", detail: "Agent scopes do not cover every requested tool", requestId }), { status: 422, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const token = generateMcpToken();
  const id = `mcp_agent_${crypto.randomUUID().replaceAll("-", "")}`;
  try {
    await db.$executeRaw(Prisma.sql`INSERT INTO "McpAgent" ("id","organizationId","ownerUserId","clientId","name","description","status","environment","scopes","allowedTools","tokenPrefix","tokenHash","expiresAt","createdAt","updatedAt") VALUES (${id},${principal.organizationId},${principal.userId},${input.clientId},${input.name},${input.description ?? null},'ACTIVE',${input.environment},${JSON.stringify(input.scopes)}::jsonb,${JSON.stringify(input.allowedTools)}::jsonb,${mcpTokenPrefix(token)},${mcpTokenHash(token)},${expiresAt},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
    await db.auditEvent.create({ data: { organizationId: principal.organizationId, actorUserId: principal.userId, action: "MCP_AGENT_CREATED", resourceType: "McpAgent", resourceId: id, requestId, metadata: { clientId: input.clientId, environment: input.environment, scopes: input.scopes, allowedTools: input.allowedTools, expiresAt: expiresAt.toISOString() } } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return new Response(JSON.stringify({ code: "CONFLICT", detail: "Agent clientId or credential already exists", requestId }), { status: 409, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
    throw error;
  }
  return new Response(JSON.stringify({ data: { id, clientId: input.clientId, name: input.name, environment: input.environment, expiresAt: expiresAt.toISOString(), token }, requestId }), { status: 201, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
}
