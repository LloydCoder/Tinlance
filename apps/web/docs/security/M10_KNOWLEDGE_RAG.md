# M10 — Permissioned Organizational Knowledge / RAG

M10 is Tinlance's governed organizational knowledge plane. It is not a chatbot and it is not an authorization authority.

## Boundary

`M3 workspace → M5 API → M10 knowledge → M7 security → M9 agents / M6 MCP`

M10 owns document lifecycle, versions, classification, permission metadata, chunking, indexing, retrieval, provenance and citations. M7 remains authoritative for security policy. M9 remains the execution plane. M8 evaluates behavior.

## Current implementation

- PostgreSQL-backed knowledge collections, documents, immutable versions, chunks, agent grants, ingestion jobs, retrievals, citations and access events.
- Explicit visibility: PUBLIC, PLATFORM_INTERNAL, ORGANIZATION_PRIVATE, TEAM_RESTRICTED, PROJECT_RESTRICTED, USER_PRIVATE.
- Explicit classification and authority metadata.
- Current-time authorization filters are applied during retrieval; vector/lexical similarity is never an authorization decision.
- Chunk-level ACL metadata travels with every indexed chunk.
- SHA-256 source/content/chunk hashes provide integrity and deduplication anchors.
- Controlled text/Markdown/JSON ingestion with size limits, normalization and secret detection. Arbitrary binary parsing is deliberately not introduced in M10.
- Heading-aware bounded chunking and PostgreSQL full-text retrieval provide the deterministic baseline. The schema records embedding model/version fields so semantic indexing can be added without mixing incompatible versions.
- Retrieval records query hashes, security context, selected sources and human-readable citation metadata without storing raw query/document content in ordinary audit metadata.
- Retrieved content is wrapped as explicitly delimited data before entering any model context. It cannot grant permissions, invoke tools, modify memory or change M7 policy.
- Agent access requires an explicit `KnowledgeAgentGrant`; an agent does not inherit its human owner's knowledge permissions.
- Revocation changes the source, version and chunks so future retrievals fail closed.

## API

- `POST /v1/knowledge/collections` — create a governed collection.
- `POST /v1/knowledge/documents` — ingest bounded text content.
- `GET /v1/knowledge/search?q=...` — authorized search/retrieval with citations.
- `POST /v1/knowledge/documents/{id}/lifecycle` — publish after governance checks.
- `DELETE /v1/knowledge/documents/{id}/lifecycle` — revoke and remove from retrieval.
- `POST /v1/knowledge/agent-grants` — grant an agent an explicit bounded collection/classification scope.

## Security invariants

1. Tenant scope is resolved from authenticated membership, not request IDs.
2. Customer-private knowledge is never treated as public because of storage location or filename.
3. Chunk ACL metadata is retained and current authorization is checked at query time.
4. Agents cannot query storage directly and cannot expand their own knowledge grant.
5. Deleted/revoked documents are excluded from active retrieval.
6. Search results expose only authorized source metadata/content.
7. Retrieved instructions are data, not commands.
8. Secrets are rejected by the text-ingestion boundary rather than embedded into the knowledge index.
9. Retrieval is bounded by result count and query length.
10. M7 decisions and M10 access events are auditable.

## Deliberate scope

M10 currently uses deterministic PostgreSQL lexical retrieval. External embedding/model providers are not enabled implicitly: restricted customer content must not leave Tinlance merely because a semantic provider is available. Future semantic indexing must preserve the same per-chunk authorization metadata and use an explicit, versioned provider/data-residency decision.

## Standards basis

The design follows OWASP RAG guidance for query-time access control, per-chunk permission metadata and treating retrieved content as data rather than commands, and uses NIST AI RMF/GenAI Profile concepts for governance, measurement and risk management.
