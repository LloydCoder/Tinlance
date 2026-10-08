# Security Policy

Tinlance treats security reports as private operational information. Do not open a public GitHub issue for a suspected vulnerability.

## Report privately

Email **hello@tinlance.com** with the subject:

SECURITY: <short vulnerability title>

Include, where safe:

- Affected component, route, package, or commit.
- Impact and realistic attack scenario.
- Reproduction steps or proof of concept.
- Preconditions and required privileges.
- Relevant logs or screenshots with secrets and personal data removed.
- Suggested remediation, if known.

Do not include live credentials, API keys, customer data, or other secrets in the report.

## Response targets

| Stage | Target |
|---|---|
| Initial acknowledgement | Within 2 business days |
| Initial triage | Within 5 business days |
| Status updates | At meaningful investigation milestones |
| Disclosure timing | Coordinated with the reporter and affected parties |

These are response targets, not a guarantee of remediation within a fixed period.

## Scope

Reports may cover authentication/session handling, authorization and tenant isolation, API/webhook security, FDE trust boundaries, MCP/tool authorization, AI/agent controls, secret handling, supply-chain exposure, SSRF, injection, privilege escalation, production configuration, or deployment controls.

## Safe research

Please avoid accessing or modifying other users' data, service degradation, social engineering, destructive testing, or public disclosure before coordinated remediation.

If testing could affect production or customer data, stop and report privately.

## Security baseline

Tinlance uses server-side authorization, tenant isolation, secure sessions, input validation, request correlation, auditability, dependency auditing, secret scanning, static analysis, container validation, SBOM generation, DAST, and AI/agent security regression tests.

The repository's stated verification baseline is OWASP ASVS 5.0 with additional controls for AI and agent execution paths.

## Public disclosure

After remediation, Tinlance may coordinate disclosure with the reporter. Do not publish exploit details or sensitive evidence before agreement on disclosure timing.
