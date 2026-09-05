# Tinlance P0 Reconciliation

## Current baseline

Audit date: 2026-09-05

### Cross-repository contract

- Tinlance gateway: `apps/fde-api`
- FDE Mastery execution API: `POST /v1/{domain}/execute`
- Canonical request envelope: `{ tenant_id, payload }`
- Tinlance gateway now forwards the canonical route and envelope.
- Production upstream authentication is OAuth 2.0 client credentials.
- Static upstream credentials are development/test-only.

### Production verification boundary

The deployed Vercel project and the public `tinlance.com` DNS target are separate concerns. The Vercel project currently has generated deployment domains but no attached `tinlance.com` custom domain. The existing public domain therefore remains outside the new application until an explicit DNS/domain attachment is completed.

### Evidence policy

A source/CI check is not treated as proof of live production behavior. The live FDE execution path remains **UNVERIFIED** until an authenticated Tinlance → FDE API → FDE Mastery execution is observed in the deployed environment.

### Next.js security baseline

Next.js 15.5.x received a critical security release on 2026-08-25. The P0 branch upgrades the web application to the patched 15.5.24 maintenance release and refreshes the lockfile before merge. The later 15.5.25 backport exists, but the critical August release gate is satisfied by 15.5.24.
