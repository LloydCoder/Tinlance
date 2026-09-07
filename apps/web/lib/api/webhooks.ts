import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function keyMaterial() { const configured = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET; if (!configured) throw new Error("WEBHOOK_SECRET_ENCRYPTION_KEY is not configured"); return createHash("sha256").update(configured).digest(); }
export function encryptSecret(value: string) { const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv); const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`; }
export function decryptSecret(value: string) { const [ivRaw, tagRaw, encryptedRaw] = value.split("."); if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Invalid webhook secret ciphertext"); const decipher = createDecipheriv("aes-256-gcm", keyMaterial(), Buffer.from(ivRaw, "base64url")); decipher.setAuthTag(Buffer.from(tagRaw, "base64url")); return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8"); }
export function signWebhook(secret: string, timestamp: number, body: string) { return `v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`; }
export function safeCompare(a: string, b: string) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); }
function privateIpv4(ip: string) { const p = ip.split(".").map(Number); return p.length === 4 && (p[0] === 10 || p[0] === 127 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || p[0] === 0); }
function privateIpv6(ip: string) { const v = ip.toLowerCase(); return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:"); }
export async function assertSafeWebhookUrl(raw: string) {
  const url = new URL(raw); if (url.protocol !== "https:") throw new Error("Webhook URL must use HTTPS"); if (url.username || url.password) throw new Error("Webhook URL must not contain credentials");
  const host = url.hostname.toLowerCase(); if (["localhost", "localhost.localdomain"].includes(host) || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) throw new Error("Webhook host is not allowed");
  const ipVersion = isIP(host); if (ipVersion === 4 && privateIpv4(host)) throw new Error("Webhook host is not allowed"); if (ipVersion === 6 && privateIpv6(host)) throw new Error("Webhook host is not allowed");
  const resolved = await lookup(host, { all: true }); if (!resolved.length) throw new Error("Webhook host could not be resolved"); for (const item of resolved) { if ((item.family === 4 && privateIpv4(item.address)) || (item.family === 6 && privateIpv6(item.address))) throw new Error("Webhook host resolves to a private address"); }
  return url;
}
