import { z } from "zod";

export type McpRisk = "READ" | "ANALYZE" | "MUTATE" | "HIGH_IMPACT" | "DESTRUCTIVE";
export type DataClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "CUSTOMER_CONFIDENTIAL" | "RESTRICTED" | "SECRET";
export type ActorType = "HUMAN" | "SERVICE" | "AGENT";
export type McpToolDefinition = { toolId: string; name: string; version: string; description: string; inputSchema: z.ZodType; requiredScopes: readonly string[]; requiredPermissions: readonly string[]; riskLevel: McpRisk; dataClassification: DataClassification; allowedActorTypes: readonly ActorType[]; allowedEnvironments: readonly string[]; tenantScope: "ORGANIZATION" | "PUBLIC"; approvalRequired: boolean; rateLimit: "read" | "write" | "expensive"; timeoutMs: number; idempotent: boolean; auditPolicy: "ALL" | "SECURITY_SENSITIVE"; enabled: boolean };
const id = z.string().trim().min(1).max(128);
const cursor = z.string().trim().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional();
const limit = z.number().int().min(1).max(100).optional();
const approvalId = z.string().trim().min(1).max(128).optional();
const base = (toolId: string, name: string, description: string, inputSchema: z.ZodType, requiredScopes: readonly string[], requiredPermissions: readonly string[], riskLevel: McpRisk, approvalRequired = false, dataClassification: DataClassification = "CUSTOMER_CONFIDENTIAL"): McpToolDefinition => ({ toolId, name, version: "1.0.0", description, inputSchema, requiredScopes, requiredPermissions, riskLevel, dataClassification, allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"], allowedEnvironments: ["production", "staging", "development"], tenantScope: "ORGANIZATION", approvalRequired, rateLimit: riskLevel === "ANALYZE" ? "expensive" : riskLevel === "MUTATE" || riskLevel === "HIGH_IMPACT" || riskLevel === "DESTRUCTIVE" ? "write" : "read", timeoutMs: riskLevel === "ANALYZE" ? 10000 : 5000, idempotent: true, auditPolicy: approvalRequired ? "ALL" : "SECURITY_SENSITIVE", enabled: true });

export const MCP_TOOLS: readonly McpToolDefinition[] = [
  base("projects.list", "tinlance.projects.list", "List projects visible to the authenticated agent's organization.", z.object({ limit, cursor }), ["mcp:read", "projects:read"], ["project:read"], "READ"),
  base("projects.get", "tinlance.projects.get", "Get one project, but only when it belongs to the authenticated organization.", z.object({ projectId: id }), ["mcp:read", "projects:read"], ["project:read"], "READ"),
  base("assessments.get", "tinlance.assessments.get", "Get an assessment scoped to the authenticated organization.", z.object({ assessmentId: id }), ["mcp:read", "assessments:read"], ["assessment:read"], "READ"),
  base("findings.list", "tinlance.findings.list", "List customer-visible findings for a tenant-owned project.", z.object({ projectId: id, limit, cursor }), ["mcp:read", "findings:read"], ["finding:read"], "READ"),
  base("reports.get", "tinlance.reports.get", "Get permitted report metadata for a tenant-owned report.", z.object({ reportId: id }), ["mcp:read", "reports:read"], ["report:read"], "READ"),
  base("remediation.list", "tinlance.remediation.list", "List remediation records for a tenant-owned project.", z.object({ projectId: id, limit, cursor }), ["mcp:read", "remediation:read"], ["remediation:read"], "READ"),
  base("knowledge.search", "tinlance.knowledge.search", "Search only organizational knowledge explicitly authorized for the authenticated MCP principal.", z.object({ query: z.string().trim().min(1).max(2000), collectionId: id.optional(), projectId: id.optional(), assessmentId: id.optional(), limit }), ["mcp:read", "knowledge:read"], ["knowledge:read"], "READ", false, "CUSTOMER_CONFIDENTIAL"),
  base("assessments.execute", "tinlance.assessments.execute", "Start an approved durable FDE assessment workflow. This never executes FDE code directly.", z.object({ projectId: id, assessmentId: id, idempotencyKey: z.string().trim().min(8).max(255), approvalId }), ["mcp:read", "mcp:write", "assessments:execute"], ["assessment:execute"], "ANALYZE", true),
];

export function getMcpTool(name: string): McpToolDefinition | null { return MCP_TOOLS.find((tool) => tool.enabled && tool.name === name) ?? null; }
export function listMcpTools(): readonly McpToolDefinition[] { return [...MCP_TOOLS].filter((tool) => tool.enabled).sort((a, b) => a.name.localeCompare(b.name)); }
