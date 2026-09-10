# M11 — Public AI Sales Engineer

## Purpose

M11 is the public technical trust and conversion interface for Tinlance. It answers technical questions from approved public authority content, identifies intent, and routes qualified interest to the existing M1 assessment flow.

## Public boundary

The implementation in `apps/web/lib/sales-assistant.ts` is intentionally public-only. It uses the existing code-controlled authority corpus from `lib/authority.ts` and does not query customer workspaces, organization-private M10 collections, M3 findings, proposals, credentials, or internal playbooks.

Public answers must not invent customers, revenue, certifications, compliance claims, partnerships, pricing, discounts, SLAs, delivery guarantees, or private architecture. Historical research remains historical.

## Security

- Input is bounded and schema-validated with Zod.
- Public requests use the existing public IP rate-limit control.
- The model endpoint is HTTPS-only and host-allowlisted.
- User and retrieved content are treated as untrusted data for model prompting.
- Prompt/system-policy extraction, private-data, credential, secret, and customer-data requests are refused.
- No model output can mutate CRM, pricing, booking, permissions, customer data, or public knowledge.
- The assessment CTA points to the canonical M1 `/assessment` flow.
- Raw conversation content is not persisted by M11.

## Model provider

Set `TINLANCE_SALES_MODEL_ENDPOINT`, `TINLANCE_SALES_MODEL_ALLOWED_HOSTS`, and optionally `TINLANCE_SALES_MODEL_TOKEN` and `TINLANCE_SALES_MODEL` to enable an OpenAI-compatible provider. The feature remains usable without a provider through a deterministic grounded fallback; it does not fabricate an answer when public evidence is insufficient.

## Evidence and citations

Each response returns the public evidence used by the answer, including title, URL, status, and update date. The corpus currently includes the verified public authority/research content already maintained by Tinlance.

## Commercial handoff

M11 does not create a second CRM. Users are sent to `/assessment`, which is the existing commercial entry point. The existing lead endpoint remains responsible for lead creation, validation, idempotency, rate limiting, and growth-event recording.

## Deployment note

The repository previously declared two five-minute Vercel cron schedules. Those schedules are incompatible with the current Vercel Hobby deployment constraint and caused the Vercel status to fail. The schedules were removed from `vercel.json`; durable automation workers remain explicit routes and require an external scheduler or a Vercel plan that supports the required cron cadence.
