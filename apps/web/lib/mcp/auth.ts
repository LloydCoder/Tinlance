import { createHash, timingSafeEqual } from "node:crypto";
import { createPublicKey, verify as verifySignature } from "node:crypto";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const PREFIX = "tl_mcp_";
const MAX_TOKEN_AGE_DAYS = 90;

type JwtPayload = Record<string, unknown> & { sub?: string; iss?: string; aud?: string | string[]; exp?: number; nbf?: number; iat?: number; scope?: string; scp?: string[]; azp?: string; client_id?: string; agent_id?: string; organization_id?: string };
type Jwk = { kid?: string; kty?: string; alg?: string; use?: string; n?: string; e?: string };
let jwksCache: { expiresAt: number; keys: Jwk[] } | null = null;

function invalidToken(message = "Invalid MCP credential"): never {
  throw new OAuthError(OAuthErrorCode.InvalidToken, message);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function base64urlDecode(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="), "base64");
}

function parseJwt(token: string): { header: Record<string, unknown>; payload: JwtPayload; signingInput: string; signature: Buffer } {
  const parts = token.split(".");
  if (parts.length !== 3) invalidToken();
  try {
    const header = JSON.parse(base64urlDecode(parts[0]).toString("utf8")) as Record<string, unknown>;
    const payload = JSON.parse(base64urlDecode(parts[1]).toString("utf8")) as JwtPayload;
    if (typeof header.alg !== "string" || header.alg !== "RS256") invalidToken("Unsupported token algorithm");
    return { header, payload, signingInput: `${parts[0]}.${parts[1]}`, signature: base64urlDecode(parts[2]) };
  } catch {
    invalidToken();
  }
}

async function loadJwks(): Promise<Jwk[]> {
  const url = process.env.MCP_OAUTH_JWKS_URL?.trim();
  if (!url || !url.startsWith("https://")) invalidToken("MCP OAuth verification is not configured");
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("MCP OAuth key service unavailable");
  const body = (await response.json()) as { keys?: Jwk[] };
  if (!Array.isArray(body.keys) || body.keys.length === 0) throw new Error("MCP OAuth key set is invalid");
  jwksCache = { keys: body.keys.filter((key) => key.kty === "RSA" && key.alg === "RS256" && typeof key.n === "string" && typeof key.e === "string"), expiresAt: Date.now() + 5 * 60 * 1000 };
  return jwksCache.keys;
}

async function verifyExternalJwt(token: string): Promise<AuthInfo> {
  const { header, payload, signingInput, signature } = parseJwt(token);
  const issuer = process.env.MCP_OAUTH_ISSUER?.trim();
  const audience = process.env.MCP_OAUTH_AUDIENCE?.trim();
  if (!issuer || !issuer.startsWith("https://") || !audience) invalidToken("MCP OAuth issuer/audience is not configured");
  if (payload.iss !== issuer) invalidToken("Token issuer is not trusted");
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) invalidToken("Token audience is not valid");
  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) invalidToken("Token is expired");
  if (typeof payload.nbf === "number" && payload.nbf > Math.floor(Date.now() / 1000) + 30) invalidToken("Token is not active");
  const kid = typeof header.kid === "string" ? header.kid : null;
  const key = (await loadJwks()).find((candidate) => candidate.kid === kid);
  if (!key) invalidToken("Token signing key is not trusted");
  const publicKey = createPublicKey({ key: { kty: "RSA", n: key.n!, e: key.e! }, format: "jwk" });
  if (!verifySignature("RSA-SHA256", Buffer.from(signingInput), publicKey, signature)) invalidToken("Token signature is invalid");
  const clientId = payload.client_id ?? payload.azp ?? payload.sub;
  const agentId = payload.agent_id ?? clientId;
  const organizationId = payload.organization_id;
  if (typeof clientId !== "string" || typeof agentId !== "string" || typeof organizationId !== "string") invalidToken("Token is missing agent identity claims");
  const agent = await db.$queryRaw<Array<{ id: string; status: string; scopes: unknown; organizationId: string; ownerUserId: string; clientId: string; environment: string }>>(Prisma.sql`SELECT "id","status","scopes","organizationId","ownerUserId","clientId","environment" FROM "McpAgent" WHERE "id"=${agentId} AND "organizationId"=${organizationId} AND "clientId"=${clientId} LIMIT 1`);
  const row = agent[0];
  if (!row || row.status !== "ACTIVE") invalidToken("Agent identity is not active");
  const scopes = Array.isArray(row.scopes) ? row.scopes.filter((value): value is string => typeof value === "string") : [];
  return { token, clientId: row.clientId, scopes, expiresAt: payload.exp, extra: { agentId: row.id, organizationId: row.organizationId, ownerUserId: row.ownerUserId, environment: row.environment, issuer } };
}

async function verifyManagedAgentToken(token: string): Promise<AuthInfo> {
  if (!token.startsWith(PREFIX) || token.length < PREFIX.length + 32) invalidToken();
  const prefix = token.slice(0, PREFIX.length + 8);
  const rows = await db.$queryRaw<Array<{ id: string; organizationId: string; ownerUserId: string; clientId: string; scopes: unknown; environment: string; expiresAt: Date | null; revokedAt: Date | null; status: string; tokenHash: string }>>(Prisma.sql`SELECT "id","organizationId","ownerUserId","clientId","scopes","environment","expiresAt","revokedAt","status","tokenHash" FROM "McpAgent" WHERE "tokenPrefix"=${prefix} LIMIT 2`);
  const row = rows.find((candidate) => {
    const actual = Buffer.from(candidate.tokenHash, "hex");
    const expected = Buffer.from(hashToken(token), "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
  if (!row || row.status !== "ACTIVE" || row.revokedAt || !row.expiresAt || row.expiresAt <= new Date()) invalidToken();
  const scopes = Array.isArray(row.scopes) ? row.scopes.filter((value): value is string => typeof value === "string") : [];
  await db.$executeRaw(Prisma.sql`UPDATE "McpAgent" SET "lastUsedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${row.id}`);
  return { token, clientId: row.clientId, scopes, expiresAt: Math.floor(row.expiresAt.getTime() / 1000), extra: { agentId: row.id, organizationId: row.organizationId, ownerUserId: row.ownerUserId, environment: row.environment, credentialType: "managed_agent" } };
}

export async function verifyMcpAccessToken(token: string): Promise<AuthInfo> {
  if (token.startsWith(PREFIX)) return verifyManagedAgentToken(token);
  if (process.env.MCP_OAUTH_JWKS_URL) return verifyExternalJwt(token);
  invalidToken("No supported MCP credential verifier is configured");
}

export function generateMcpToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const value = Buffer.from(bytes).toString("base64url");
  return `${PREFIX}${value}`;
}

export function mcpTokenPrefix(token: string) {
  return token.slice(0, PREFIX.length + 8);
}

export function mcpTokenHash(token: string) {
  return hashToken(token);
}

export function validateAgentExpiry(expiresAt: Date) {
  const max = new Date(Date.now() + MAX_TOKEN_AGE_DAYS * 24 * 60 * 60 * 1000);
  if (expiresAt <= new Date() || expiresAt > max) throw new Error("Agent credential expiry must be in the future and no more than 90 days away");
}
