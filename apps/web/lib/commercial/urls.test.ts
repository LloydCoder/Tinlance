import { describe, expect, it } from "vitest";
import { canonicalAppUrl, isTrustedPaystackCheckoutUrl } from "@/lib/commercial/urls";

describe("canonical commercial URLs", () => {
  it("uses the configured application origin rather than a request host", () => {
    expect(canonicalAppUrl("/proposal/token", "https://www.tinlance.com/base")).toBe("https://www.tinlance.com/proposal/token");
  });

  it("fails closed when the canonical application URL is missing or insecure", () => {
    expect(() => canonicalAppUrl("/pay/token", "")).toThrow("canonical_app_url_not_configured");
    expect(() => canonicalAppUrl("/pay/token", "http://tinlance.com")).toThrow("canonical_app_url_must_use_https");
  });

  it("rejects absolute and protocol-relative path overrides", () => {
    expect(() => canonicalAppUrl("//attacker.example/path", "https://www.tinlance.com")).toThrow("invalid_canonical_path");
    expect(() => canonicalAppUrl("https://attacker.example/path", "https://www.tinlance.com")).toThrow("invalid_canonical_path");
  });

  it("accepts only HTTPS Paystack checkout URLs", () => {
    expect(isTrustedPaystackCheckoutUrl("https://checkout.paystack.com/abc")).toBe(true);
    expect(isTrustedPaystackCheckoutUrl("http://checkout.paystack.com/abc")).toBe(false);
    expect(isTrustedPaystackCheckoutUrl("https://attacker.example/abc")).toBe(false);
    expect(isTrustedPaystackCheckoutUrl("https://checkout.paystack.com.attacker.example/abc")).toBe(false);
  });
});
