# Unfixable Dependency Audit Exception

## Status

Active, narrowly scoped exception for repository CI only.

## Advisory

- GHSA: GHSA-vfj7-8cjw-p6xm
- Package: `braces`
- Affected release in the current development dependency graph: `3.0.3`
- Severity: High
- Upstream status: no patched release is currently published.
- Dependency path: `@next/eslint-plugin-next → fast-glob → micromatch → braces`

## Why the exception exists

The affected package is present through the website's development-only ESLint toolchain. It is not a production dependency of the Tinlance web application. The upstream advisory currently has no patched `braces` release, so forcing an unrelated major or incompatible release would be less safe than retaining the supported dependency graph.

CI therefore ignores **only this GHSA** for the high-severity audit gate. All other high/critical findings remain blocking.

## Compensating controls

1. The vulnerable dependency remains confined to the development linting toolchain.
2. The exact GHSA is explicitly named in every affected CI audit command; this is not a blanket audit disablement.
3. Dependency-review and supply-chain workflows remain blocking.
4. Secret scanning remains blocking.
5. Production dependency audits remain subject to the normal audit gate.
6. The exception must be removed immediately when the upstream dependency chain provides a supported patched release.

## Review trigger

Re-check the upstream advisory and the `@next/eslint-plugin-next` dependency tree whenever the Next.js/ESLint toolchain is upgraded or when the advisory changes. Do not expand this exception to additional packages or advisories without a separate security review.

## Evidence

The exception is based on the upstream GitHub Advisory Database record for GHSA-vfj7-8cjw-p6xm and pnpm's documented GHSA-specific `audit --ignore` behavior.

## Container scanner exception: urllib3 CVE attribution

The FDE API image has a direct urllib3>=2.8.0,<3.0 dependency and the build installs 2.8.0. CI executes an image-level metadata assertion requiring exactly one urllib3 distribution at version 2.8.0. Trivy nevertheless attributes CVE-2026-97687 and CVE-2026-97689 to installed version 2.7.0 while simultaneously reporting the 2.8.0 METADATA file. Trivy documents that third-party SBOM inputs can produce inaccurate detection. These two CVEs are therefore temporarily suppressed only for the FDE API image, with expiry 2026-12-31. All other HIGH/CRITICAL findings remain blocking.
