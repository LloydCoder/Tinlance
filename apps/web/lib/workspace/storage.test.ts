import { describe, expect, it } from "vitest";
import { validateEvidenceFile } from "./storage";

describe("M3 evidence upload validation", () => {
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
