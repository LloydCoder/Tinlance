import { describe, expect, it } from "vitest";
import { canEntitlementTransition, canOnboardingTransition, canPaymentTransition, canProposalTransition, canProvisioningTransition, deterministicProvisioningKey, validateMoney, validatePaymentAgainstInvoice } from "@/lib/platform/state";

describe("Sprint F commercial invariants", () => {
  it("does not allow proposal acceptance from draft", () => expect(canProposalTransition("DRAFT", "ACCEPTED")).toBe(false));
  it("requires sent/viewed before proposal acceptance", () => { expect(canProposalTransition("SENT", "ACCEPTED")).toBe(true); expect(canProposalTransition("VIEWED", "ACCEPTED")).toBe(true); });
  it("prevents payment success from being reversed except by refund", () => { expect(canPaymentTransition("SUCCEEDED", "FAILED")).toBe(false); expect(canPaymentTransition("SUCCEEDED", "REFUNDED")).toBe(true); });
  it("does not allow an entitlement to become active from revoked", () => expect(canEntitlementTransition("REVOKED", "ACTIVE")).toBe(false));
  it("does not allow provisioning completion without running", () => expect(canProvisioningTransition("REQUESTED", "COMPLETED")).toBe(false));
  it("requires onboarding to enter provisioning before active", () => expect(canOnboardingTransition("READY_FOR_PROVISIONING", "ACTIVE")).toBe(false));
  it("uses integer minor units only", () => { expect(() => validateMoney(100.5, "USD")).toThrow("invalid_amount"); expect(validateMoney(10000, "USD")).toEqual({ amountMinor: 10000, currency: "USD" }); });
  it("rejects amount and currency tampering", () => { expect(() => validatePaymentAgainstInvoice({ invoiceAmountMinor: 1000, invoiceCurrency: "USD", providerAmountMinor: 999, providerCurrency: "USD" })).toThrow("amount_mismatch"); expect(() => validatePaymentAgainstInvoice({ invoiceAmountMinor: 1000, invoiceCurrency: "USD", providerAmountMinor: 1000, providerCurrency: "NGN" })).toThrow("currency_mismatch"); });
  it("uses deterministic provisioning keys", () => expect(deterministicProvisioningKey("ent-1")).toBe("provision:ent-1"));
});
