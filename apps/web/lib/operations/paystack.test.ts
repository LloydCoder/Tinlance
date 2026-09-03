import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { paystackEventId, verifyPaystackSignature } from "./paystack";

describe("Paystack webhook verification", () => {
  it("accepts a valid signature", () => {
    const payload = JSON.stringify({ event: "charge.success" });
    const secret = "test-secret";
    const signature = createHmac("sha512", secret).update(payload).digest("hex");
    expect(verifyPaystackSignature(payload, signature, secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyPaystackSignature("{}", "invalid", "test-secret")).toBe(false);
  });

  it("keeps different lifecycle events distinct for one transaction", () => {
    const payload = JSON.stringify({
      event: "charge.success",
      data: { id: 12345, reference: "invoice-123" },
    });

    expect(paystackEventId("charge.success", 12345, "invoice-123", payload)).not.toBe(
      paystackEventId("refund.processed", 12345, "invoice-123", payload),
    );
  });

  it("is stable across retries of the same event", () => {
    const payload = JSON.stringify({
      event: "charge.success",
      data: { id: 12345, reference: "invoice-123" },
    });

    expect(paystackEventId("charge.success", 12345, "invoice-123", payload)).toBe(
      "charge.success:12345:invoice-123",
    );
  });

  it("uses the payload fingerprint when Paystack does not provide data.id", () => {
    const payload = JSON.stringify({
      event: "invoice.create",
      data: { reference: "invoice-123" },
    });

    const first = paystackEventId("invoice.create", undefined, "invoice-123", payload);
    const second = paystackEventId("invoice.create", undefined, "invoice-123", payload);

    expect(first).toBe(second);
    expect(first).toMatch(/^invoice\.create:[a-f0-9]{64}:invoice-123$/);
  });
});
