import { z } from "zod";

export type McpRisk = "READ" | "ANALYZE" | "MUTATE" | "HIGH_IMPACT" | "DESTRUCTIVE";
export type DataClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "CUSTOMER_CONFIDENTIAL" | "RESTRICTED" | "SECRET";
export type ActorType = "HUMAN" | "SERVICE" | "AGENT";

export type McpToolDefinition = {
  toolId: string;
  name: string;
  version: string;
  description: string;
  inputSchema: z.ZodType;
  requiredScopes: readonly string[];
  requiredPermissions: readonly string[];
  riskLevel: McpRisk;
  dataClassification: DataClassification;
  allowedActorTypes: readonly ActorType[];
  allowedEnvironments: readonly string[];
  tenantScope: "ORGANIZATION" | "PUBLIC";
  approvalRequired: boolean;
  rateLimit: "read" | "write" | "expensive";
  timeoutMs: number;
  idempotent: boolean;
  auditPolicy: "ALL" | "SECURITY_SENSITIVE";
  enabled: boolean;
};

const projectId = z.string().trim().min(1).max(128);
const cursor = z.string().trim().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional();
const limit = z.number().int().min(1).max(100).optional();

export const MCP_TOOLS: readonly McpToolDefinition[] = [
  {
    toolId: "projects.list",
    name: "tinlance.projects.list",
    version: "1.0.0",
    description: "List projects visible to the authenticated agent's organization.",
    inputSchema: z.object({ limit, cursor }),
    requiredScopes: ["mcp:read", "projects:read"],
    requiredPermissions: ["project:read"],
    riskLevel: "READ",
    dataClassification: "CUSTOMER_CONFIDENTIAL",
    allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"],
    allowedEnvironments: ["production", "staging", "development"],
    tenantScope: "ORGANIZATION",
    approvalRequired: false,
    rateLimit: "read",
    timeoutMs: 5000,
    idempotent: true,
    auditPolicy: "SECURITY_SENSITIVE",
    enabled: true,
  },
  {
    toolId: "projects.get",
    name: "tinlance.projects.get",
    version: "1.0.0",
    description: "Get one project, but only when it belongs to the authenticated organization.",
    inputSchema: z.object({ projectId }),
    requiredScopes: ["mcp:read", "projects:read"],
    requiredPermissions: ["project:read"],
    riskLevel: "READ",
    dataClassification: "CUSTOMER_CONFIDENTIAL",
    allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"],
    allowedEnvironments: ["production", "staging", "development"],
    tenantScope: "ORGANIZATION",
    approvalRequired: false,
    rateLimit: "read",
    timeoutMs: 5000,
    idempotent: true,
    auditPolicy: "SECURITY_SENSITIVE",
    enabled: true,
  },
  {
    toolId: "assessments.get",
    name: "tinlance.assessments.get",
    version: "1.0.0",
    description: "Get an assessment scoped to the authenticated organization.",
    inputSchema: z.object({ assessmentId: projectId }),
    requiredScopes: ["mcp:read", "assessments:read"],
    requiredPermissions: ["assessment:read"],
    riskLevel: "READ",
    dataClassification: "CUSTOMER_CONFIDENTIAL",
    allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"],
    allowedEnvironments: ["production", "staging", "development"],
    tenantScope: "ORGANIZATION",
    approvalRequired: false,
    rateLimit: "read",
    timeoutMs: 5000,
    idempotent: true,
    auditPolicy: "SECURITY_SENSITIVE",
    enabled: true,
  },
  {
    toolId: "findings.list",
    name: "tinlance.findings.list",
    version: "1.0.0",
    description: "List findings for a tenant-owned project.",
    inputSchema: z.object({ projectId, limit, cursor }),
    requiredScopes: ["mcp:read", "findings:read"],
    requiredPermissions: ["finding:read"],
    riskLevel: "READ",
    dataClassification: "CUSTOMER_CONFIDENTIAL",
    allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"],
    allowedEnvironments: ["production", "staging", "development"],
    tenantScope: "ORGANIZATION",
    approvalRequired: false,
    rateLimit: "read",
    timeoutMs: 5000,
    idempotent: true,
    auditPolicy: "SECURITY_SENSITIVE",
    enabled: true,
  },
  {
    toolId: "reports.get",
    name: "tinlance.reports.get",
    version: "1.0.0",
    description: "Get permitted report metadata and content for a tenant-owned report.",
    inputSchema: z.object({ reportId: projectId }),
    requiredScopes: ["mcp:read", "reports:read"],
    requiredPermissions: ["report:read"],
    riskLevel: "READ",
    dataClassification: "CUSTOMER_CONFIDENTIAL",
    allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"],
    allowedEnvironments: ["production", "staging", "development"],
    tenantScope: "ORGANIZATION",
    approvalRequired: false,
    rateLimit: "read",
    timeoutMs: 5000,
    idempotent: true,
    auditPolicy: "SECURITY_SENSITIVE",
    enabled: true,
  },
  {
    toolId: "remediation.list",
    name: "tinlance.remediation.list",
    version: "1.0.0",
    description: "List remediation records for a tenant-owned project.",
    inputSchema: z.object({ projectId, limit, cursor }),
    requiredScopes: ["mcp:read", "remediation:read"],
    requiredPermissions: ["remediation:read"],
    riskLevel: "READ",
    dataClassification: "CUSTOMER_CONFIDENTIAL",
    allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"],
    allowedEnvironments: ["production", "staging", "development"],
    tenantScope: "ORGANIZATION",
    approvalRequired: false,
    rateLimit: "read",
    timeoutMs: 5000,
    idempotent: true,
    auditPolicy: "SECURITY_SENSITIVE",
    enabled: true,
  },
  {
    toolId: "assessments.execute",
    name: "tinlance.assessments.execute",
    version: "1.0.0",
    description: "Start an approved durable FDE assessment workflow. This never executes FDE code directly.",
    inputSchema: z.object({ projectId, assessmentId: projectId, idempotencyKey: z.string().trim().min(8).max(255) }),
    requiredScopes: ["mcp:write", "assessments:execute"],
    requiredPermissions: ["assessment:execute"],
    riskLevel: "ANALYZE",
    dataClassification: "CUSTOMER_CONFIDENTIAL",
    allowedActorTypes: ["AGENT", "SERVICE", "HUMAN"],
    allowedEnvironments: ["production", "staging", "development"],
    tenantScope: "ORGANIZATION",
    approvalRequired: true,
    rateLimit: "expensive",
    timeoutMs: 10000,
    idempotent: true,
    auditPolicy: "ALL",
    enabled: true,
  },
];

export function getMcpTool(name: string): McpToolDefinition | null {
  return MCP_TOOLS.find((tool) => tool.enabled && tool.name === name) ?? null;
}

export function listMcpTools(): readonly McpToolDefinition[] {
  return [...MCP_TOOLS].filter((tool) => tool.enabled).sort((a, b) => a.name.localeCompare(b.name));
}
