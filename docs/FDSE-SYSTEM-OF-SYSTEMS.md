# FDSE System-of-Systems Validation

## Status

Phase IV validates the repository-level system-of-systems contract across the Tinlance customer/application boundary, FDE Mastery, FDSE, Agent Platform, Agent Platform SDK, Agent OS, public production routing, CI/security/provenance evidence and observability health surfaces.

This phase verifies compatibility and evidence boundaries in a deterministic GitHub-hosted fixture. It does not claim customer production deployment, independent certification, or production SLO compliance.

## Pinned systems

| System | Revision |
|---|---|
| Tinlance | current PR/main revision under test |
| FDSE | `0bfc34212a453f9a79c706d81a5082f869f08987` |
| FDE Mastery | `0aae198cadd7f69d8173653803bca19e780154ca` |
| Agent Platform | `775132611af59d301abd4f03d86d4bcdf6806fef` |
| Agent Platform SDK | `2307c705047200ebaede73f0bd628da38542d31f` |
| Agent OS | `ab08fe3d145da378ec56ce392f70600c247c81f5` |

The pinned revisions are evidence subjects; they are not claims that external production deployments are running those exact revisions.

## Responsibility boundaries

- Tinlance owns customer-facing application, assessment and FDE API boundaries.
- FDE Mastery owns domain engineering execution.
- FDSE owns engineering meaning, integration semantics, evidence and assurance requirements.
- Agent Platform owns generic governed execution authority.
- Agent Platform SDK owns the developer composition surface and does not duplicate authority.
- Agent OS owns the higher-level agent environment/workspace/lifecycle surface.
- GitHub/CI, deployment, observability and artifact/provenance providers remain external infrastructure authorities.

## Validation layers

The Phase IV gate verifies:

1. all pinned repositories are reachable and immutable by SHA;
2. FDSE and Agent Platform integration contracts remain executable;
3. FDE Mastery exposes all eight supported domain contracts;
4. Agent Platform SDK and Agent OS preserve their documented dependency direction;
5. the Tinlance FDE API contract remains present and its repository tests pass;
6. the public production FDSE route, sitemap and health endpoint are reachable;
7. the public evidence boundary does not claim customer production proof from repository evidence;
8. the resulting system manifest is deterministic and digestible.

## Evidence spine

The system-of-systems evidence path is:

`Request → Context → Plan → Risk → Policy → Agent/Workflow → Change → Execution → Observation → Evidence → Finding → Evaluation → Assurance → Certification → Release → Incident/Feedback → Context`

Phase IV verifies the repository and public-boundary portions of this spine. Customer-environment and operational production evidence remain Phase VI gates.

## Security and supply-chain basis

The validation design follows the principle that software provenance and security claims must be verified against explicit expectations rather than inferred from the existence of an artifact or repository. SLSA v1.2 treats provenance as verifiable information about how software was produced and source revisions as evidence subjects. NIST SSDF provides secure-development practice vocabulary, while OWASP's agentic and MCP guidance informs the agent/tool trust boundaries.

No certification or compliance claim is made by referencing these frameworks.

## Completion gate

Phase IV is complete only when the implementation, documentation, cross-repository workflow, required Tinlance CI gates and merge evidence are green. The gate must fail closed if a pinned dependency, contract, public production surface or declared evidence expectation cannot be verified.
