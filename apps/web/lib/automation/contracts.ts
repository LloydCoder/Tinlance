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
  if (!Number.isInteger(value.maxSteps) || Number(value.maxSteps) < steps.length || Number(value.maxSteps) > 100) {
    throw new Error("workflow maxSteps must cover every declared step and be <= 100");
  }
  if (!Number.isInteger(value.maxDurationSeconds) || Number(value.maxDurationSeconds) < 1 || Number(value.maxDurationSeconds) > 604800) {
    throw new Error("workflow maxDurationSeconds must be between 1 and 604800");
  }
  const keys = new Set<string>();
  for (const raw of steps) {
    if (!raw || typeof raw !== "object") throw new Error("workflow step must be an object");
    const step = raw as Record<string, unknown>;
    if (typeof step.key !== "string" || !/^[a-z][a-z0-9_:-]{0,127}$/.test(step.key)) throw new Error("invalid workflow step key");
    if (keys.has(step.key)) throw new Error("workflow step keys must be unique");
    keys.add(step.key);
    if (!["SYSTEM", "FDE", "APPROVAL", "CUSTOMER_INPUT"].includes(String(step.type))) throw new Error("unsupported workflow step type");
    if (step.type === "FDE" && (typeof step.domain !== "string" || typeof step.capabilityId !== "string" || typeof step.capabilityVersion !== "string")) throw new Error("FDE steps require pinned domain and capability version");
    if (step.timeoutSeconds !== undefined && (!Number.isInteger(step.timeoutSeconds) || Number(step.timeoutSeconds) < 1 || Number(step.timeoutSeconds) > 3600)) {
      throw new Error("step timeoutSeconds must be between 1 and 3600");
    }
    if (step.retry !== undefined) {
      if (!step.retry || typeof step.retry !== "object") throw new Error("step retry policy must be an object");
      const retry = step.retry as Record<string, unknown>;
      if (retry.maxAttempts !== undefined && (!Number.isInteger(retry.maxAttempts) || Number(retry.maxAttempts) < 1 || Number(retry.maxAttempts) > 10)) {
        throw new Error("step retry maxAttempts must be between 1 and 10");
      }
      if (retry.backoffSeconds !== undefined && (!Number.isInteger(retry.backoffSeconds) || Number(retry.backoffSeconds) < 1 || Number(retry.backoffSeconds) > 300)) {
        throw new Error("step retry backoffSeconds must be between 1 and 300");
      }
    }
  }
  const policies = value.policies;
  if (!policies || typeof policies !== "object") throw new Error("workflow policies are required");
  const policyValues = policies as Record<string, unknown>;
  if (typeof policyValues.dryRun !== "boolean" ||
      typeof policyValues.externalWritesRequireApproval !== "boolean" ||
      typeof policyValues.customerDataUntrusted !== "boolean") {
    throw new Error("workflow policies must explicitly define dryRun, externalWritesRequireApproval and customerDataUntrusted");
  }
  const publishIndex = steps.findIndex(raw => raw && typeof raw === "object" && (raw as Record<string, unknown>).key === "publish_report");
  if (publishIndex >= 0) {
    const hasPriorApproval = steps.slice(0, publishIndex).some(raw =>
      raw && typeof raw === "object" && (raw as Record<string, unknown>).type === "APPROVAL"
    );
    if (!hasPriorApproval || policyValues.externalWritesRequireApproval !== true) {
      throw new Error("report publication requires an explicit prior human approval step");
    }
  }
  if (steps.some(raw => raw && typeof raw === "object" && (raw as Record<string, unknown>).type === "CUSTOMER_INPUT") &&
      policyValues.customerDataUntrusted !== true) {
    throw new Error("customer input workflows must treat customer data as untrusted");
  }
  return true;
}

export function isCustomerVisibleFinding(input: { visibility: string }) {
  return input.visibility === "CUSTOMER";
}

export function isIndependentlyVerifiedRemediation(input: {
  remediationStatus: string;
  findingStatus: string;
  verificationResult: string | null;
  ownerUserId: string | null;
  verifierUserId: string | null;
}) {
  return ["VERIFIED", "CLOSED"].includes(input.remediationStatus) &&
    ["VERIFIED", "CLOSED"].includes(input.findingStatus) &&
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
