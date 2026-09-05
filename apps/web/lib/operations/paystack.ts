import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha512", secret).update(payload).digest("hex");
  const provided = Buffer.from(signature, "utf8");
  const actual = Buffer.from(expected, "utf8");
  return provided.length === actual.length && timingSafeEqual(provided, actual);
}

/**
 * Paystack webhook payloads expose the transaction id as data.id, not a
 * provider-generated event id. Include the event type and reference so two
 * different lifecycle events for the same transaction cannot collide while
 * retries of the same event remain idempotent.
 */
export function paystackEventId(
  eventType: string,
  transactionId: number | string | undefined,
  reference: string | null,
  payload: string,
): string {
  const transactionKey = transactionId != null && String(transactionId).trim()
    ? String(transactionId).trim()
    : createHash("sha256").update(payload).digest("hex");
  return [eventType.trim(), transactionKey, reference?.trim() ?? ""].join(":");
}
