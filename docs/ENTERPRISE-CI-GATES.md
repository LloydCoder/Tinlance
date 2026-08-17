# Enterprise CI Gates

Tinlance CI verifies the application and FDE gateway as production artifacts, not only as source code.

## Required gates

- Web typecheck, lint, tests, formatting, dependency audit, and production build.
- FDE API lint and tests.
- AI security regression tests for the FDE gateway trust boundary.
- Production container builds for web and FDE API.
- Non-root container users and health checks.
- High/critical container vulnerability scanning with Trivy.
- CycloneDX SBOM generation and schema/content validation for both images.
- Static security analysis with Semgrep using OWASP Top 10, JavaScript, and Python rules.

The CI gates are intended to provide repeatable evidence for enterprise security review. They do not replace production infrastructure validation, secrets management, runtime monitoring, disaster recovery testing, or external compliance certification.

Container images are built from the same commit that passed application tests, so the enterprise gate validates the deployable artifact rather than a separate source-only build.
