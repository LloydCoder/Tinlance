import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCsrfToken, verifyCsrfToken } from "./csrf";

describe("contact form CSRF tokens", () => {
  beforeEach(() => {
    vi.stubEnv("CSRF_SECRET", "tinlance-test-csrf-secret-with-32-chars");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a valid signed token within its lifetime", () => {
    const now = Date.UTC(2026, 10, 12, 10, 0, 0);
    const token = createCsrfToken(now);

    expect(verifyCsrfToken(token, now + 30 * 60 * 1000)).toBe(true);
  });

  it("rejects expired tokens", () => {
    const now = Date.UTC(2026, 10, 12, 10, 0, 0);
    const token = createCsrfToken(now);

    expect(verifyCsrfToken(token, now + 61 * 60 * 1000)).toBe(false);
  });

  it("rejects tokens with future timestamps", () => {
    const now = Date.UTC(2026, 10, 12, 10, 0, 0);
    const token = createCsrfToken(now + 5 * 60 * 1000);

    expect(verifyCsrfToken(token, now)).toBe(false);
  });

  it("rejects tampered and malformed tokens", () => {
    const now = Date.UTC(2026, 10, 12, 10, 0, 0);
    const token = createCsrfToken(now);
    const [timestamp, signature] = token.split(".");

    expect(verifyCsrfToken(`${timestamp}.${signature}x`, now)).toBe(false);
    expect(verifyCsrfToken("not-a-token", now)).toBe(false);
    expect(verifyCsrfToken(null, now)).toBe(false);
  });
});
