# M8 Operations Runbook

## Evaluation pipeline failure
1. Confirm the run status and distinguish infrastructure/test failure from model/security failure.
2. Inspect the CI job and evaluation trace IDs.
3. Do not convert an infrastructure error into PASS.
4. Retry only after the root cause is known.

## Critical security regression
1. Treat the gate as BLOCKED.
2. Preserve the evaluation run, evidence hashes, target version and commit SHA.
3. Create/remain linked to the M3 finding/remediation workflow where applicable.
4. Fix the target/control.
5. Re-run the exact dataset/suite and compare to the immutable baseline.
6. Verify independently before closing the finding.

## Red-team discovery
1. Pause the campaign if scope or containment is uncertain.
2. Preserve the attack case, trace and campaign authorization.
3. Confirm the target/environment/scope did not change.
4. Convert material discoveries into permanent regression cases.

## Dataset poisoning
1. Disable publication of the affected dataset version.
2. Preserve the immutable artifact/hash and audit trail.
3. Inspect schema validation and provenance.
4. Publish a new version after review; never mutate a certified version.

## Grader failure
A grader error is not a PASS. Mark the run inconclusive/error and repair or replace the grader under review. Security graders must remain deterministic for security invariants.

## Evaluation worker compromise
Revoke the worker credential, stop the campaign/run, preserve audit evidence, rotate affected credentials and inspect network/sandbox logs. Workers must not have broad production privileges.

## Production behavior drift
Do not attack production automatically. Alert on drift, create a controlled reproduction target, then run M8 in sandbox/staging. Production red-team requires explicit authorization and bounded scope.

## Cost runaway
Stop at max requests, max duration, max model calls/tokens and max estimated cost. Preserve partial results and classify the run as COST_LIMIT rather than model failure.

## Credential compromise
Revoke/rotate credentials, invalidate affected sessions/tokens, preserve security audit events and re-run the relevant security suite after remediation.
