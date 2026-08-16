import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha512", secret).update(payload).digest("hex");
  const provided = Buffer.from(signature, "utf8");
  const actual = Buffer.from(expected, "utf8");
  return provided.length === actual.length && timingSafeEqual(provided, actual);
}
