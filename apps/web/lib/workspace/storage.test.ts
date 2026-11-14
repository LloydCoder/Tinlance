import { describe, expect, it } from "vitest";
import { isTrustedPrivateBlobUrl, validateEvidenceFile } from "./storage";

describe("M3 evidence upload validation", () => {
  it("accepts only exact HTTPS private Vercel Blob hosts", () => {
    expect(isTrustedPrivateBlobUrl("https://store123.private.blob.vercel-storage.com/evidence/file")).toBe(true);
    expect(isTrustedPrivateBlobUrl("https://attacker.example/.private.blob.vercel-storage.com/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("https://store123.private.blob.vercel-storage.com.evil.example/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("http://store123.private.blob.vercel-storage.com/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("https://user:pass@store123.private.blob.vercel-storage.com/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("https://store123.private.blob.vercel-storage.com:8443/file")).toBe(false);
  });

  it("accepts an allowlisted PDF filename/type", () => {
    const file = new File([new Uint8Array([37,80,68,70,45])], "assessment.pdf", { type: "application/pdf" });
    expect(() => validateEvidenceFile(file)).not.toThrow();
  });

  it("rejects executable and arbitrary content types", () => {
    const file = new File(["alert(1)"], "evidence.js", { type: "application/javascript" });
    expect(() => validateEvidenceFile(file)).toThrow("file_type_not_allowed");
  });

  it("rejects files above the bounded upload size", () => {
    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.txt", { type: "text/plain" });
    expect(() => validateEvidenceFile(file)).toThrow("file_size_not_allowed");
  });
});
