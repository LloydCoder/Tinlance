import { describe, expect, it } from "vitest";
import { assertSafeWebhookUrl, signWebhook, safeCompare } from "./webhooks";

describe("M5 webhook security", () => {
  it("uses timestamp-bound HMAC signatures", () => {
    const body = JSON.stringify({ id: "evt_1" }); const timestamp = 1700000000; const signature = signWebhook("secret", timestamp, body);
    expect(signature).toMatch(/^v1=[a-f0-9]{64}$/); expect(safeCompare(signature, signWebhook("secret", timestamp, body))).toBe(true); expect(safeCompare(signature, signWebhook("other", timestamp, body))).toBe(false);
  });
  it("rejects private and non-HTTPS webhook targets", async () => {
    await expect(assertSafeWebhookUrl("http://example.com/hook")).rejects.toThrow("HTTPS");
    await expect(assertSafeWebhookUrl("https://127.0.0.1/hook")).rejects.toThrow("not allowed");
    await expect(assertSafeWebhookUrl("https://169.254.169.254/latest/meta-data")).rejects.toThrow("not allowed");
  });
});
