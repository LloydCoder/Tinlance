const sections = [
  ["Authentication", "External integrations use organization-scoped Bearer API credentials. Credentials are scoped, expirable, revocable and shown only once."],
  ["Stable resources", "Projects, assessments, findings, evidence metadata, reports, remediations and governed workflow runs are exposed through /v1."],
  ["Async execution", "Assessment execution returns 202 with a workflowRunId. M4 durable automation performs the FDE work and the run endpoint exposes its state."],
  ["Errors", "Errors use application/problem+json with HTTP status, stable code and requestId."],
  ["Pagination", "Collections use bounded cursor pagination with a default of 25 and a maximum of 100."],
  ["Idempotency", "Retryable mutations use Idempotency-Key. Replays return the original result; a changed request with the same key is rejected."],
  ["Webhooks", "Webhook delivery uses timestamp-bound HMAC-SHA256 signatures, SSRF controls, queued retries and event IDs for deduplication."],
];
export default function ApiDocsPage() {
  return <main className="mx-auto max-w-4xl px-6 py-16"><p className="text-sm font-medium uppercase tracking-widest text-neutral-500">Tinlance Developer Platform</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">API v1</h1><p className="mt-4 max-w-2xl text-neutral-600">A stable, tenant-aware interface to governed Tinlance capabilities. The canonical machine-readable contract is OpenAPI 3.1.1.</p><div className="mt-8 flex gap-4 text-sm"><a className="underline" href="/docs/api/openapi">OpenAPI JSON</a><a className="underline" href="/v1">API metadata</a></div><div className="mt-12 grid gap-6 md:grid-cols-2">{sections.map(([title, body]) => <section key={title} className="rounded-xl border p-6"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p></section>)}</div></main>;
}
