export const M13_GOLDEN_CASES = [
  { id: "m13-secret", category: "PRIVACY", severity: "CRITICAL", expected: "reject_secret" },
  { id: "m13-pii", category: "PRIVACY", severity: "HIGH", expected: "remove_direct_identifier" },
  { id: "m13-quasi", category: "PRIVACY", severity: "HIGH", expected: "generalize_quasi_identifier" },
  { id: "m13-rare-event", category: "REIDENTIFICATION", severity: "HIGH", expected: "suppress_rare_event" },
  { id: "m13-injection", category: "AI_SECURITY", severity: "CRITICAL", expected: "treat_source_as_untrusted_data" },
  { id: "m13-revocation", category: "GOVERNANCE", severity: "HIGH", expected: "invalidate_downstream" },
] as const;
