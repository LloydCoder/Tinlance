export type RetryClassification = "RETRYABLE" | "NON_RETRYABLE";

const retryableStatuses = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

export function classifyFailure(input: { status?: number; code?: string; message?: string }): RetryClassification {
  if (typeof input.status === "number" && retryableStatuses.has(input.status)) return "RETRYABLE";
  const value = `${input.code ?? ""} ${input.message ?? ""}`.toLowerCase();
  if (/timeout|temporar|unavailable|rate.?limit|connection reset|worker interrupted/.test(value)) return "RETRYABLE";
  return "NON_RETRYABLE";
}

export function exponentialBackoff(attempt: number, initialSeconds = 5, maxSeconds = 300) {
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error("attempt must be >= 1");
  return Math.min(maxSeconds, initialSeconds * 2 ** (attempt - 1));
}

export function validateWorkflowDefinition(definition: unknown) {
  if (!definition || typeof definition !== "object") throw new Error("workflow definition must be an object");
  const value = definition as Record<string, unknown>;
  const steps = value.steps;
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 100) throw new Error("workflow must contain 1-100 steps");
  const keys = new Set<string>();
  for (const raw of steps) {
    if (!raw || typeof raw !== "object") throw new Error("workflow step must be an object");
    const step = raw as Record<string, unknown>;
    if (typeof step.key !== "string" || !/^[a-z][a-z0-9_:-]{0,127}$/.test(step.key)) throw new Error("invalid workflow step key");
    if (keys.has(step.key)) throw new Error("workflow step keys must be unique");
    keys.add(step.key);
    if (!["SYSTEM", "FDE", "APPROVAL", "CUSTOMER_INPUT"].includes(String(step.type))) throw new Error("unsupported workflow step type");
    if (step.type === "FDE" && (typeof step.domain !== "string" || typeof step.capabilityId !== "string" || typeof step.capabilityVersion !== "string")) throw new Error("FDE steps require pinned domain and capability version");
  }
  const policies = value.policies;
  if (!policies || typeof policies !== "object") throw new Error("workflow policies are required");
  return true;
}

export function isIndependentlyVerifiedRemediation(input: {
  remediationStatus: string;
  findingStatus: string;
  verificationResult: string | null;
  ownerUserId: string | null;
  verifierUserId: string | null;
}) {
  return input.remediationStatus === "VERIFIED" &&
    input.findingStatus === "VERIFIED" &&
    input.verificationResult === "PASS" &&
    Boolean(input.verifierUserId) &&
    input.verifierUserId !== input.ownerUserId;
}

export function validateWorkflowSignal(signal: unknown): { customerEvidenceId?: string } {
  if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
    throw new Error("unsupported workflow signal");
  }
  const value = signal as Record<string, unknown>;
  const keys = Object.keys(value);
  if (keys.length === 0) return {};
  if (
    keys.length !== 1 ||
    keys[0] !== "customerEvidenceId" ||
    typeof value.customerEvidenceId !== "string" ||
    value.customerEvidenceId.trim().length === 0 ||
    value.customerEvidenceId.length > 255
  ) {
    throw new Error("unsupported workflow signal");
  }
  return { customerEvidenceId: value.customerEvidenceId.trim() };
}

export function isUntrustedContent(value: unknown) {
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.some(isUntrustedContent);
  if (value && typeof value === "object") return Object.values(value).some(isUntrustedContent);
  return false;
}
