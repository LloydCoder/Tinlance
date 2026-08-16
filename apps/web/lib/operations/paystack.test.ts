import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyPaystackSignature } from "./paystack";

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
});
