import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { hasWorkspacePermission, type WorkspacePermission, type WorkspacePrincipal } from "@/lib/workspace/authorization";

export const M7_POLICY_ID = "tinlance-default-security-policy";
export const M7_POLICY_VERSION = "1";

export type PrincipalType = "HUMAN" | "SERVICE" | "API_CLIENT" | "MCP_CLIENT" | "AI_AGENT" | "WORKFLOW" | "EXTERNAL_INTEGRATION" | "SYSTEM";
export type SecurityDecision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "REQUIRE_STEP_UP" | "RATE_LIMIT" | "BLOCKED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DataClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "SECRET";

export type SecurityPrincipal = Readonly<{
  principalId: string;
  principalType: PrincipalType;
  organizationId: string;
  userId?: string;
  agentId?: string;
  clientId?: string;
  authenticationMethod?: string;
  authenticationStrength?: "NONE" | "BASIC" | "MFA" | "STRONG";
  scopes: readonly string[];
  permissions: readonly string[];
  delegationId?: string;
  environment?: string;
}>;

export type SecurityRequest = Readonly<{
  principal: SecurityPrincipal;
  action: string;
  resourceType: string;
  resourceId?: string;
  toolId?: string;
  dataClassification?: DataClassification;
  method?: string;
  path?: string;
  context?: Record<string, unknown>;
  requestedRisk?: RiskLevel;
  approvalPresent?: boolean;
  stepUpPresent?: boolean;
}>;

export type SecurityDecisionResult = Readonly<{
  decision: SecurityDecision;
  policyId: string;
  policyVersion: string;
  reasonCode: string;
  risk: { score: number; level: RiskLevel };
  approvalRequired: boolean;
  stepUpRequired: boolean;
}>;

const permissionAliases: Record<string, WorkspacePermission> = {
  "projects:read": "project:read",
  "projects:write": "project:update",
  "assessments:read": "assessment:read",
  "assessments:write": "assessment:create",
  "assessments:execute": "assessment:execute",
  "findings:read": "finding:read",
  "evidence:read": "evidence:read",
  "reports:read": "report:read",
  "remediation:read": "remediation:read",
  "workflows:read": "assessment:read",
  "workflows:execute": "assessment:execute",
};

const destructiveWords = /(delete|destroy|revoke|rotate|disable|publish|close|approve|credential|permission|policy|billing|payment)/i;
const highImpactWords = /(execute|write|update|create|publish|verify|remediate|workflow|integration)/i;

function riskFor(input: Pick<SecurityRequest, "action" | "method" | "path" | "dataClassification" | "requestedRisk">): { score: number; level: RiskLevel } {
  if (input.requestedRisk) return { score: input.requestedRisk === "CRITICAL" ? 90 : input.requestedRisk === "HIGH" ? 70 : input.requestedRisk === "MEDIUM" ? 45 : 15, level: input.requestedRisk };
  const text = `${input.action} ${input.method ?? ""} ${input.path ?? ""}`;
  let score = 10;
  if (highImpactWords.test(text)) score += 25;
  if (destructiveWords.test(text)) score += 35;
  if (input.dataClassification === "CONFIDENTIAL") score += 15;
  if (input.dataClassification === "RESTRICTED") score += 25;
  if (input.dataClassification === "SECRET") score += 40;
  if (input.method === "DELETE") score += 30;
  score = Math.min(100, score);
  return { score, level: score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW" };
}

function emergencyBlocked(organizationId: string, principalType: PrincipalType, toolId?: string) {
  if (process.env.TINLANCE_SECURITY_GATEWAY_DENY_ALL === "true") return true;
  const orgs = new Set((process.env.TINLANCE_SECURITY_GATEWAY_DENY_ORGANIZATIONS ?? "").split(",").map((v) => v.trim()).filter(Boolean));
  if (orgs.has(organizationId)) return true;
  const tools = new Set((process.env.TINLANCE_SECURITY_GATEWAY_DISABLED_TOOLS ?? "").split(",").map((v) => v.trim()).filter(Boolean));
  if (toolId && tools.has(toolId)) return true;
  if (principalType === "AI_AGENT" && process.env.TINLANCE_SECURITY_GATEWAY_DENY_AGENTS === "true") return true;
  return false;
}

function hasRequiredPermission(principal: SecurityPrincipal, action: string) {
  if (principal.permissions.includes(action)) return true;
  const alias = permissionAliases[action];
  return alias ? principal.permissions.includes(alias) : false;
}

export function buildPrincipal(input: {
  principalId: string;
  principalType: PrincipalType;
  organizationId: string;
  userId?: string;
  agentId?: string;
  clientId?: string;
  scopes?: readonly string[];
  permissions?: readonly string[];
  delegationId?: string;
  authenticationMethod?: string;
  authenticationStrength?: SecurityPrincipal["authenticationStrength"];
  environment?: string;
}): SecurityPrincipal {
  if (!input.organizationId || !input.principalId) throw new Error("security_principal_incomplete");
  return { ...input, scopes: input.scopes ?? [], permissions: input.permissions ?? [] };
}

export function evaluateSecurity(input: SecurityRequest): SecurityDecisionResult {
  const risk = riskFor(input);
  if (emergencyBlocked(input.principal.organizationId, input.principal.principalType, input.toolId)) return { decision: "BLOCKED", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "SECURITY_CONTROL_TRIGGERED", risk, approvalRequired: false, stepUpRequired: false };
  if (!input.principal.organizationId) return { decision: "DENY", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "TENANT_UNRESOLVED", risk, approvalRequired: false, stepUpRequired: false };
  if (input.context?.tenantId && input.context.tenantId !== input.principal.organizationId) return { decision: "DENY", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "TENANT_MISMATCH", risk, approvalRequired: false, stepUpRequired: false };
  if (input.context?.requiredPermission && typeof input.context.requiredPermission === "string" && !hasRequiredPermission(input.principal, input.context.requiredPermission)) return { decision: "DENY", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "INSUFFICIENT_PERMISSION", risk, approvalRequired: false, stepUpRequired: false };
  if (risk.level === "CRITICAL" && !input.approvalPresent) return { decision: "REQUIRE_APPROVAL", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "CRITICAL_RISK_APPROVAL_REQUIRED", risk, approvalRequired: true, stepUpRequired: false };
  if (risk.level === "HIGH" && !input.approvalPresent) return { decision: "REQUIRE_APPROVAL", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "HIGH_RISK_APPROVAL_REQUIRED", risk, approvalRequired: true, stepUpRequired: false };
  if ((risk.level === "HIGH" || risk.level === "CRITICAL") && !input.stepUpPresent) return { decision: "REQUIRE_STEP_UP", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "STEP_UP_REQUIRED", risk, approvalRequired: false, stepUpRequired: true };
  return { decision: "ALLOW", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "POLICY_ALLOWED", risk, approvalRequired: false, stepUpRequired: false };
}

export async function recordSecurityDecision(input: { request: SecurityRequest; result: SecurityDecisionResult; requestId: string; outcome?: string; errorCode?: string }) {
  const metadata = {
    securityGateway: "M7",
    policyId: input.result.policyId,
    policyVersion: input.result.policyVersion,
    principalId: input.request.principal.principalId,
    principalType: input.request.principal.principalType,
    userId: input.request.principal.userId ?? null,
    agentId: input.request.principal.agentId ?? null,
    clientId: input.request.principal.clientId ?? null,
    delegationId: input.request.principal.delegationId ?? null,
    action: input.request.action,
    resourceType: input.request.resourceType,
    resourceId: input.request.resourceId ?? null,
    toolId: input.request.toolId ?? null,
    decision: input.result.decision,
    reasonCode: input.result.reasonCode,
    riskScore: input.result.risk.score,
    riskLevel: input.result.risk.level,
    approvalRequired: input.result.approvalRequired,
    stepUpRequired: input.result.stepUpRequired,
    outcome: input.outcome ?? null,
    errorCode: input.errorCode ?? null,
    inputClassification: input.request.dataClassification ?? "INTERNAL",
    method: input.request.method ?? null,
    path: input.request.path ?? null,
  };
  await db.auditEvent.create({ data: { organizationId: input.request.principal.organizationId, actorUserId: input.request.principal.userId ?? null, action: `M7_${input.result.decision}`, resourceType: input.request.resourceType, resourceId: input.request.resourceId ?? input.request.principal.principalId, requestId: input.requestId, metadata } });
}

export async function enforceSecurity(input: SecurityRequest & { requestId: string }): Promise<SecurityDecisionResult> {
  const result = evaluateSecurity(input);
  await recordSecurityDecision({ request: input, result, requestId: input.requestId });
  return result;
}

export async function authorizeWorkspaceAction(input: { workspace: WorkspacePrincipal; permission: WorkspacePermission; action: string; resourceType: string; resourceId?: string; requestId: string; risk?: RiskLevel; approvalPresent?: boolean; stepUpPresent?: boolean; context?: Record<string, unknown> }) {
  const principal = buildPrincipal({ principalId: input.workspace.userId, principalType: "HUMAN", organizationId: input.workspace.organizationId, userId: input.workspace.userId, permissions: hasWorkspacePermission(input.workspace, input.permission) ? [input.permission] : [], authenticationMethod: "better-auth-session", authenticationStrength: "MFA" });
  const request: SecurityRequest = { principal, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, requestedRisk: input.risk, approvalPresent: input.approvalPresent, stepUpPresent: input.stepUpPresent, context: { ...(input.context ?? {}), requiredPermission: input.permission } };
  return enforceSecurity({ ...request, requestId: input.requestId });
}

export function sanitizeOutput<T>(value: T): T {
  const secret = /(bearer\s+[A-Za-z0-9._~+\-/]+=*|(?:api[_-]?key|secret|token|password|client_secret)\s*[:=]\s*[A-Za-z0-9._~+\-/=]{12,})/gi;
  const walk = (input: unknown): unknown => {
    if (typeof input === "string") return input.replace(secret, "[REDACTED]");
    if (Array.isArray(input)) return input.map(walk);
    if (input && typeof input === "object") return Object.fromEntries(Object.entries(input as Record<string, unknown>).map(([key, item]) => [/(token|secret|password|apiKey|accessToken|refreshToken)/i.test(key) ? key : key, /(token|secret|password|apiKey|accessToken|refreshToken)/i.test(key) ? "[REDACTED]" : walk(item)]));
    return input;
  };
  return walk(value) as T;
}

export function hashSensitive(value: unknown) { return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex"); }
