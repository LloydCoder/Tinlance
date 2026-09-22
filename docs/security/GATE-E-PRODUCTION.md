# Gate E — Production Canonical & Runtime Hardening

## Purpose

Gate E closes the production-origin drift and adds a repeatable production smoke contract for the public Tinlance deployment.

## Controls

- `https://www.tinlance.com` is the sole canonical production origin.
- `https://tinlance.com` is treated as the legacy host and redirected to the www origin by middleware.
- Production, preview and test URL resolution cannot silently promote `www.tinlance.com` or an arbitrary origin to canonical.
- Production smoke validation checks the public origin, legacy-host redirect, health/readiness endpoints, security headers, robots and sitemap canonicalization.
- The smoke workflow runs after pushes to `main`, hourly, and on manual dispatch. It waits for the production deployment to converge before validating the live service.

## Why the smoke gate is separate

Repository CI proves source/build/test correctness. Vercel production verification proves the deployed public behavior. Gate E keeps those evidence classes separate so a green source build cannot be mistaken for a verified production deployment.

## Verification

The Gate E workflow must fail if:

- the apex site is unreachable or does not return HTTP 200;
- the legacy apex origin does not redirect to the www origin;
- health or readiness is unavailable or returns an unexpected status;
- required baseline security headers disappear;
- robots or sitemap expose the legacy origin.

GitHub repository rulesets/branch protection remain platform configuration and must be independently enforced in repository settings. The repository currently exposes no ruleset through the connected GitHub API.

## References

- GitHub branch protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- GitHub rulesets: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
