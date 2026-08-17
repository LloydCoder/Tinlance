# Enterprise CI Gates

Tinlance CI verifies the application and FDE gateway as deployable artifacts, not only as source code.

## Required gates

### Web application

- Typecheck.
- ESLint.
- Unit/integration tests.
- Formatting.
- Dependency security audit.
- Production build.

### FDE API

- Python linting/static validation.
- FastAPI tests.
- Authentication and upstream-routing tests.
- OAuth token caching tests.
- Domain-agent/security regression tests.

### Security and supply chain

- Static security analysis with Semgrep using applicable OWASP Top 10, JavaScript, and Python rules.
- AI security regression tests for the FDE gateway and agent execution trust boundary.
- High/critical dependency findings block release.
- Container validation.
- Non-root container users and health checks.
- High/critical container vulnerability scanning with Trivy.
- CycloneDX SBOM generation and schema/content validation.

## Artifact integrity

Container images are built from the same commit that passed application tests. The enterprise gate therefore validates the deployable artifact rather than relying only on a source-only build.

## CI versus production verification

A green CI run proves that the tested code and build artifacts satisfy the automated gates. It does **not** prove that production secrets, database migrations, third-party credentials, DNS, upstream services, monitoring, backups, or runtime behavior are correctly configured.

Production acceptance must separately verify:

- Better Auth production sessions and RBAC;
- tenant isolation;
- Neon/Prisma migrations and transactions;
- Paystack signature/idempotency behavior;
- Tinlance → FDE API → `fde-mastery` execution;
- health/readiness behavior; and
- deployed security headers and observability.

These controls are intended to provide repeatable evidence for enterprise security review. They do not replace external compliance certification or organizational controls.
