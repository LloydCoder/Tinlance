# Phase VI Evidence Contract

Phase VI evidence is classified by what the observation can actually prove.

## Classes

- repository-automated: source, tests, workflows and deterministic repository checks.
- release-security: release-candidate security and supply-chain checks.
- production-observation: bounded observations against the live Tinlance service.
- external-customer: evidence produced by a real external controlled environment.
- human-operational: review, acceptance, ownership, rollback and operational sign-off.

## Rules

1. Evidence must identify the validated revision.
2. Evidence must identify its environment and scope.
3. Synthetic fixtures cannot satisfy external-customer evidence.
4. Short automated production observations cannot be represented as sustained SLO certification.
5. Missing cryptographic provenance or attestation must remain explicitly marked missing.
6. Phase VII remains locked until the external and human-operational gates are accepted.

The JSON schema in this directory is the canonical shape for the external evidence package.
