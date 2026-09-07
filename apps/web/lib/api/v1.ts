import { createHash, randomBytes, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { getRequestId } from "@/lib/security/request-id";
import { hasWorkspacePermission, type WorkspacePermission } from "@/lib/workspace/authorization";

export const API_VERSION = "v1";
export const API_KEY_PREFIX = "tl_live_";
export const PUBLIC_SCOPES = [
  "projects:read", "projects:write", "assessments:read", "assessments:write", "assessments:execute",
  "findings:read", "evidence:read", "reports:read", "remediation:read", "workflows:read", "workflows:execute",
  "webhooks:read", "webhooks:write",
] as const;
export type ApiScope = (typeof PUBLIC_SCOPES)[number];

export type ApiPrincipal = Readonly<{
  organizationId: string;
  userId: string;
  credentialId: string | null;
  scopes: readonly string[];
  requestId: string;
  authenticatedBy: "api_key" | "session";
}>;

const scopePermission: Record<ApiScope, WorkspacePermission> = {
  "projects:read": "project:read", "projects:write": "project:update", "assessments:read": "assessment:read",
  "assessments:write": "assessment:create", "assessments:execute": "assessment:execute", "findings:read": "finding:read",
  "evidence:read": "evidence:read", "reports:read": "report:read", "remediation:read": "remediation:read",
  "workflows:read": "assessment:read", "workflows:execute": "assessment:execute", "webhooks:read": "project:read", "webhooks:write": "project:update",
};

export function problem(requestId: string, status: number, code: string, title: string, detail?: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ type: `https://tinlance.com/docs/api/errors/${code}`, title, status, detail: detail ?? title, code, requestId, ...extra }, { status, headers: { "content-type": "application/problem+json", "cache-control": "no-store", "x-request-id": requestId } });
}

export function ok<T>(request: Request, data: T, status = 200, extraHeaders: Record<string, string> = {}) {
  const requestId = getRequestId(request);
  return NextResponse.json({ data, requestId }, { status, headers: { "cache-control": "private, no-store", "x-request-id": requestId, ...extraHeaders } });
}

export function cursorPage<T>(request: Request, data: T[], nextCursor: string | null, hasMore: boolean) {
  return ok(request, { data, pagination: { nextCursor, hasMore } });
}

export function parsePagination(request: Request) {
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "25");
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 25;
  const cursor = url.searchParams.get("cursor");
  return { limit, cursor: cursor && /^[A-Za-z0-9_-]{1,256}$/.test(cursor) ? cursor : null, url };
}

function hashSecret(secret: string) { return createHash("sha256").update(secret).digest("hex"); }
export function createApiSecret() {
  const value = randomBytes(32).toString("base64url");
  return `${API_KEY_PREFIX}${value}`;
}

async function sessionPrincipal(requestId: string): Promise<ApiPrincipal | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session.activeOrganizationId) return null;
  const membership = await db.member.findUnique({ where: { organizationId_userId: { organizationId: session.session.activeOrganizationId, userId: session.user.id } }, select: { role: true } });
  if (!membership) return null;
  const permissions = PUBLIC_SCOPES.filter((scope) => hasWorkspacePermission({ userId: session.user.id, organizationId: session.session.activeOrganizationId!, memberRole: membership.role, globalRole: null, isPrivileged: membership.role === "owner" }, scopePermission[scope]));
  return { organizationId: session.session.activeOrganizationId, userId: session.user.id, credentialId: null, scopes: permissions, requestId, authenticatedBy: "session" };
}

export async function authenticateApi(request: Request, requiredScope?: ApiScope): Promise<{ principal: ApiPrincipal } | { response: Response }> {
  const requestId = getRequestId(request);
  const authorization = request.headers.get("authorization") ?? "";
  let principal: ApiPrincipal | null = null;
  if (authorization.startsWith("Bearer ")) {
    const secret = authorization.slice(7).trim();
    if (secret.startsWith(API_KEY_PREFIX)) {
      const prefix = secret.slice(0, API_KEY_PREFIX.length + 8);
      const rows = await db.apiCredential.findMany({ where: { prefix }, take: 2 });
      const credential = rows.find((item) => item.secretHash === hashSecret(secret) && !item.revokedAt && (!item.expiresAt || item.expiresAt > new Date()));
      if (credential) {
        const scopes = Array.isArray(credential.scopes) ? credential.scopes.filter((value): value is string => typeof value === "string") : [];
        const member = await db.member.findUnique({ where: { organizationId_userId: { organizationId: credential.organizationId, userId: credential.createdByUserId } }, select: { role: true } });
        if (!member) return { response: problem(requestId, 401, "authentication_invalid", "Invalid API credential") };
        principal = { organizationId: credential.organizationId, userId: credential.createdByUserId, credentialId: credential.id, scopes, requestId, authenticatedBy: "api_key" };
        await db.apiCredential.update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
      }
    }
  }
  if (!principal) principal = await sessionPrincipal(requestId);
  if (!principal) return { response: problem(requestId, 401, "authentication_required", "Authentication required") };
  if (requiredScope && !principal.scopes.includes(requiredScope)) return { response: problem(requestId, 403, "authorization_denied", "Insufficient scope", `The credential lacks ${requiredScope}.`) };
  const rateKey = `${principal.organizationId}:${principal.credentialId ?? principal.userId}:${requiredScope ?? "read"}`;
  const rate = await enforcePublicRateLimit(rateKey);
  if (!rate.allowed) return { response: problem(requestId, 429, "rate_limit_exceeded", "Rate limit exceeded", "Retry later.", { retryAfter: rate.retryAfter }) };
  return { principal };
}

export function bodyHash(value: unknown) { return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex"); }

export async function parseJson<T>(request: Request, schema: z.ZodType<T>) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return { error: parsed.error } as const;
    return { data: parsed.data } as const;
  } catch {
    return { error: "invalid_json" } as const;
  }
}

export function auditAction(action: string) { return action.toUpperCase().replace(/[^A-Z0-9]+/g, "_"); }
export { randomUUID };
