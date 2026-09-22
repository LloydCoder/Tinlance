# Gate D — Supply-Chain Security & Repository Governance

## Purpose

Gate D establishes repository-level supply-chain controls that complement the existing application, container, SBOM and static-security gates.

## Controls implemented in the repository

1. Pull-request dependency review
   - Runs on pull requests targeting main.
   - Uses the pinned actions/dependency-review-action v5 release.
   - Fails for newly introduced high or critical runtime dependency vulnerabilities.
   - Uses contents: read workflow permissions.

2. Full-history secret scanning
   - Runs on pushes, pull requests, merge groups, a daily schedule and manual dispatch.
   - Uses the pinned gitleaks-action v3 release.
   - Checks the complete Git history (fetch-depth: 0).
   - Fails the workflow when Gitleaks reports a secret.
   - Uses the repository-provided GITHUB_TOKEN only for the action's GitHub integration.

3. Automated dependency update coverage
   - Dependabot monitors the root npm dependencies, FDE Python dependencies and GitHub Actions.
   - Updates are grouped by ecosystem/dependency class to reduce unnecessary PR noise.

4. Least-privilege workflow permissions
   - New security workflows explicitly grant only contents: read.

## Security boundary

CI-based Gitleaks is a repository control, not a replacement for GitHub Secret Protection / push protection. GitHub platform controls can prevent supported secrets from entering the repository before CI runs.

For the public Tinlance repository, GitHub's user-level push protection also provides protection against supported secrets during pushes. Repository-level Secret Protection/push-protection status must be verified in GitHub Security and quality settings separately from repository code.

Likewise, dependency-review enforcement is only a mandatory merge blocker when repository branch/ruleset configuration requires the corresponding check to pass.

Gate D therefore treats:
- repository workflow controls as code-verifiable;
- GitHub Security/quality settings and branch/ruleset enforcement as platform configuration that must be independently verified.

## Verification requirements

A Gate D merge is not considered successful unless:
- dependency review is green;
- full-history Gitleaks is green;
- existing enterprise CI remains green;
- no high/critical runtime dependency is introduced;
- documentation matches the actual controls.

## References

- GitHub Secret Scanning: https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning
- GitHub Push Protection: https://docs.github.com/en/code-security/concepts/secret-security/push-protection
- GitHub Dependency Review: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review
- Gitleaks Action: https://github.com/gitleaks/gitleaks-action
