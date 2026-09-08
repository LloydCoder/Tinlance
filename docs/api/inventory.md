# M5 API inventory

Stable public contract is only the `/v1` surface below. Legacy `/api/v1/workspace/*`, `/api/v1/automation/*`, internal worker routes, admin routes and the FDE service are classified as internal application/service interfaces and are not part of the customer contract.

| Method | Stable path | Auth | Scope | Tenant | Side effect | Idempotency |
|---|---|---|---|---|---|---|
| GET | `/v1` | none | none | none | no | no |
| GET | `/v1/projects` | session/API key | projects:read | org | no | no |
| POST | `/v1/projects` | session/API key | projects:write | org | create | required |
| GET | `/v1/projects/{projectId}` | session/API key | projects:read | org | no | no |
| PATCH | `/v1/projects/{projectId}` | session/API key | projects:write | org | update | If-Match |
| GET | `/v1/projects/{projectId}/assessments` | session/API key | assessments:read | org | no | no |
| POST | `/v1/projects/{projectId}/assessments` | session/API key | assessments:write | org | create | required |
| GET | `/v1/assessments/{assessmentId}` | session/API key | assessments:read | org | no | no |
| POST | `/v1/assessments/{assessmentId}/execute` | session/API key | assessments:execute | org | expensive async workflow | required |
| GET | `/v1/findings` | session/API key | findings:read | org | no | no |
| GET | `/v1/findings/{findingId}` | session/API key | findings:read | org | no | no |
| GET | `/v1/evidence` | session/API key | evidence:read | org | no | no |
| GET | `/v1/evidence/{evidenceId}` | session/API key | evidence:read | org | no | no |
| GET | `/v1/reports` | session/API key | reports:read | org | no | no |
| GET | `/v1/reports/{reportId}` | session/API key | reports:read | org | no | no |
| GET | `/v1/remediations` | session/API key | remediation:read | org | no | no |
| GET | `/v1/remediations/{remediationId}` | session/API key | remediation:read | org | no | no |
| GET | `/v1/workflow-runs/{runId}` | session/API key | workflows:read | org | no | no |
| POST | `/v1/workflow-runs/{runId}/cancel` | session/API key | workflows:execute | org | cancel | required |
| GET | `/v1/webhooks` | session/API key | webhooks:read | org | no | no |
| POST | `/v1/webhooks` | session/API key | webhooks:write | org | create subscription | write policy |
| DELETE | `/v1/webhooks/{webhookId}` | session/API key | webhooks:write | org | disable | no |
| POST | `/v1/webhooks/{webhookId}` | session/API key | webhooks:write | org | rotate secret | no |
| GET/POST | `/v1/api-keys` | Better Auth session | organization admin | org | credential lifecycle | no |
| DELETE | `/v1/api-keys/{credentialId}` | Better Auth session | organization admin | org | revoke credential | no |

## Internal interfaces

- Existing M3 workspace APIs remain for the customer web application and are not promoted into the stable public contract without an explicit compatibility decision.
- M4 automation control/worker routes remain internal and require the existing cron/admin controls.
- FDE API remains a service-to-service boundary protected by its service authentication and canonical upstream `POST /v1/triage/{client_id}/{domain}` contract.
