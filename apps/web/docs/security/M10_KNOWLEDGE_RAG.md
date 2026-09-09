# M10 — Permissioned Organizational Knowledge / RAG

M10 is Tinlance's governed organizational knowledge plane. It is not a chatbot and it is not an authorization authority.

## Boundary

`M3 workspace → M5 API → M10 knowledge → M7 security → M9 agents / M6 MCP`

M10 owns document lifecycle, versions, classification, permission metadata, chunking, indexing, retrieval, provenance and citations. M7 remains authoritative for security policy. M9 remains the execution plane. M8 evaluates behavior.

## Current implementation

- PostgreSQL-backed knowledge collections, documents, immutable versions, chunks, explicit agent grants, ingestion jobs, retrievals, citations and access events.
- Explicit visibility: PUBLIC, PLATFORM_INTERNAL, ORGANIZATION_PRIVATE, TEAM_RESTRICTED, PROJECT_RESTRICTED, USER_PRIVATE.
- Explicit classification and authority metadata.
- Retrieval authorization is evaluated against the current authenticated principal and current chunk ACL metadata. Similarity/rank is never an authorization decision.
- Every chunk carries organization, collection, document/version, classification, visibility, project/assessment scope, role/user/team ACL metadata, permission version and authority metadata.
- SHA-256 normalized-document and chunk hashes are verified before authorized results become context. A mismatch fails closed.
- Text/Markdown/JSON ingestion is bounded, normalized and scanned for secret-shaped content. Arbitrary binary parsing is deliberately outside the first production M10 scope.
- Ingestion creates QUARANTINED documents and non-active chunks. Publication is a separate governed action; unapproved content is not searchable.
- Heading-aware bounded chunking and PostgreSQL full-text retrieval provide the deterministic baseline. Embedding fields are versioned extension points; no external embedding provider is enabled implicitly.
- Retrieval records a hashed query, security scope, counts, selected citations and latency without storing raw private query text in ordinary audit metadata.
- Retrieved content is explicitly delimited as untrusted data before model context assembly. It cannot grant permissions, invoke tools, modify memory or change M7 policy.
- Agent access requires a live `KnowledgeAgentGrant` for the matching collection, classification and optional project/assessment scope. Agents do not inherit their human owner's knowledge permissions.
- Revocation changes the document, version and chunk states so future retrieval fails closed; publication never reactivates a revoked document.

## API

- `POST /v1/knowledge/collections` — create an organization-scoped governed collection.
- `POST /v1/knowledge/documents` — ingest bounded text content into quarantine.
- `GET /v1/knowledge/search?q=...` — authorized search/retrieval with provenance and citations.
- `POST /v1/knowledge/documents/{id}/lifecycle` — publish a quarantined document after governance checks.
- `DELETE /v1/knowledge/documents/{id}/lifecycle` — revoke a document and its derived retrieval records.
- `POST /v1/knowledge/agent-grants` — grant an agent an explicit collection/classification/scope boundary.
- M6 exposes `tinlance.knowledge.search`; M9 reaches knowledge through M6/M7-controlled runtime paths rather than direct database access.

## Security invariants

1. Tenant scope is derived from authenticated membership, not caller-supplied organization IDs.
2. Customer-private knowledge never becomes public because of a filename, URL or storage location.
3. Chunk ACL metadata is retained and current authorization is enforced at query time.
4. Agent retrieval requires an explicit grant for the selected collection; agent scope cannot be widened by query parameters.
5. Project-restricted and user-restricted knowledge is excluded unless the corresponding authorized scope is present.
6. TEAM_RESTRICTED content fails closed until a real team-membership integration is available; an empty team ACL never becomes an implicit allow.
7. Deleted/revoked documents and versions are excluded from active retrieval.
8. Citation provenance is derived from the authorized retrieved chunk, including its content hash.
9. Retrieved instructions are data, not commands.
10. Secret-shaped text is rejected before indexing.
11. Retrieval is bounded by query length and result count.
12. M7 decisions and M10 access events are auditable.

## Deliberate scope

M10 currently uses deterministic PostgreSQL lexical retrieval. It is intentionally not a generic vector-search demo and does not silently transmit customer data to an embedding/model provider. A future semantic index must preserve the same per-chunk authorization metadata, version the embedding model/index, and make provider, data-use and residency decisions explicit before restricted data leaves Tinlance.

## Standards basis

The design follows OWASP RAG security guidance for query-time access control, per-chunk permission metadata, source provenance, deletion/revocation propagation, context delimiters and fail-closed behavior. NIST AI RMF/GenAI Profile concepts are used for governance, measurement, monitoring and risk management. These references do not constitute a formal certification.
