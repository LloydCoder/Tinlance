# Contributing to Tinlance

Tinlance is a public, proprietary engineering repository. The source is published for engineering transparency and review; the repository is not licensed for unrestricted reuse. See [LICENSE](./LICENSE).

## Before you start

1. Read [SECURITY.md](./SECURITY.md).
2. Read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
3. Search existing issues and pull requests.
4. Keep changes scoped to one problem.
5. Never commit credentials, customer data, production configuration, or secrets.

## Development setup

Requirements:

- Node.js 22.x
- Corepack
- pnpm 10.14.0
- Python 3.12 for the FDE API
- Docker for container/security validation
- PostgreSQL 16 for application tests and migrations

~~~bash
corepack enable
pnpm install --frozen-lockfile
~~~

Main checks:

~~~bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm format:check
~~~

FDE API:

~~~bash
cd apps/fde-api
pip install -e '.[test]'
pytest -q
ruff check .
python -m pip check
~~~

## Branches and pull requests

Use focused branches such as feat/name, fix/name, docs/name, or chore/name.

A pull request should explain the problem, intended outcome, scope, validation, security/operational implications, and required documentation changes.

Use Conventional Commit-style prefixes where practical: feat, fix, docs, chore, test, security, and refactor.

## Review standard

Changes should preserve server-side authorization, tenant isolation, least privilege, fail-closed security controls, request correlation, auditability, stable API contracts, evidence boundaries, and existing CI/security gates.

Do not duplicate identity, authorization, workflow, audit, or execution authority when an existing subsystem already owns it.

## Documentation

When behavior, architecture, public claims, security controls, API contracts, or operations change, update the relevant documentation in the same pull request. See [docs/README.md](./docs/README.md).

## License and contributions

This repository is proprietary. Submitting a contribution does not grant an unrestricted license to the repository. If a contribution requires a separate license or agreement, maintainers will address that before merge.

By submitting a pull request, you confirm that you have the right to submit the contribution and that it does not contain confidential information or unauthorized third-party material.
