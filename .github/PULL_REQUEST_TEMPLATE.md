## Summary

Describe the problem and intended outcome.

## Change

- [ ] Code
- [ ] Documentation
- [ ] Tests
- [ ] Security
- [ ] Configuration
- [ ] API contract

What changed?

## Validation

List the exact commands, workflow runs, or production checks performed.

~~~text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm format:check
~~~

For FDE API changes, include the applicable Python checks.

## Security and data boundaries

- [ ] No credentials or secrets added.
- [ ] Authorization remains server-side.
- [ ] Tenant boundaries are preserved.
- [ ] External input remains treated as untrusted.
- [ ] High-risk actions retain approval/audit controls.
- [ ] Security documentation was updated when required.

## Documentation

- [ ] README/docs updated when behavior or architecture changed.
- [ ] Public claims match current evidence.
- [ ] No unsupported production or customer claims introduced.

## Reviewer notes

Call out migrations, breaking changes, deployment requirements, follow-up work, or known limitations.
