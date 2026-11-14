import { describe, expect, it } from "vitest";
import { isTrustedPrivateBlobUrl, readVerifiedPrivateEvidence, sha256, validateEvidenceFile } from "./storage";

describe("M3 evidence upload validation", () => {
  it("accepts only exact HTTPS private Vercel Blob hosts", () => {
    expect(isTrustedPrivateBlobUrl("https://store123.private.blob.vercel-storage.com/evidence/file")).toBe(true);
    expect(isTrustedPrivateBlobUrl("https://attacker.example/.private.blob.vercel-storage.com/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("https://store123.private.blob.vercel-storage.com.evil.example/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("http://store123.private.blob.vercel-storage.com/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("https://user:pass@store123.private.blob.vercel-storage.com/file")).toBe(false);
    expect(isTrustedPrivateBlobUrl("https://store123.private.blob.vercel-storage.com:8443/file")).toBe(false);
  });

  it("returns evidence only when downloaded size and SHA-256 match the stored manifest", async () => {
    const bytes = new TextEncoder().encode("proof");
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const response = new Response(bytes);
    await expect(readVerifiedPrivateEvidence(response, 5n, sha256(buffer))).resolves.toEqual(buffer);
  });

  it("rejects a download whose byte count differs from the stored size", async () => {
    const response = new Response("proof");
    await expect(readVerifiedPrivateEvidence(response, 6n, "0".repeat(64))).rejects.toThrow("evidence_size_mismatch");
  });

  it("rejects a download whose SHA-256 differs from the stored manifest", async () => {
    const response = new Response("proof");
    await expect(readVerifiedPrivateEvidence(response, 5n, "0".repeat(64))).rejects.toThrow("evidence_integrity_mismatch");
  });

  it("rejects manifest sizes above the upload limit", async () => {
    const response = new Response("proof");
    await expect(readVerifiedPrivateEvidence(response, BigInt(4 * 1024 * 1024 + 1), "0".repeat(64))).rejects.toThrow("evidence_size_invalid");
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
