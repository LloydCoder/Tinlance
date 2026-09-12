# Evidence & Trust

Tinlance uses a single public evidence vocabulary so technical claims can be scoped consistently across the website.

## Evidence status

- **IMPLEMENTED** — exists in the current implementation. This does not imply production validation.
- **TESTED** — automated or reproducible tests demonstrate the stated behavior.
- **VALIDATED** — documented validation beyond ordinary implementation/testing, with scope and limitations stated.
- **EXPERIMENTAL** — implemented for research/evaluation; production suitability has not been established.
- **PLANNED** — intentionally identified for future implementation and not currently implemented.

Status labels are rendered by `apps/web/components/evidence-status.tsx` and their authoritative meanings live in `apps/web/lib/evidence/taxonomy.ts`.

## Evidence metadata

Public evidence records are defined in `apps/web/lib/evidence/taxonomy.ts`. Fields are included only when they have a meaningful provenance purpose: identifier, title, status, evidence type, description, scope, public source, repository, version/date where known, methodology, dataset/sample size where applicable, environment where applicable, result, limitations and public/private boundary.

Evidence is treated as content. URLs are fixed public references in the registry; user-controlled metadata is not rendered as executable HTML.

## Public claim flow

`Claim → status → evidence record → source/repository → methodology → result → scope → limitations`

A repository test or green CI run is not customer validation. Production evidence is reserved for actual production evidence. Independent validation is reserved for evidence that genuinely qualifies as independent validation.

## Case-study taxonomy

The public registry distinguishes:

- Customer case study
- Engineering case study
- Open-source validation
- Research validation
- Synthetic evaluation
- Architecture case study

Customer case studies require a real engagement and permission to publish. Until such evidence exists, engineering and open-source evidence must not be presented as customer success.

## Architecture map

`/engineering` presents a public abstraction of Tinlance platform responsibilities and control relationships. It is intentionally not a production topology. The M1–M14 modules are represented with evidence statuses; cross-links describe relationships without exposing secrets, internal endpoints, customer information or private repositories.

M4 Automation and M6 MCP Gateway are shown as cross-cutting relationships rather than forcing the platform into a misleading linear dependency chain. FDE API and FDE Mastery are represented as the FDE boundary. ThreatFade is a distinct product and public evidence source, not a Tinlance subsystem.

## GitHub policy

Only verified public repositories are linked from the public site:

- `LloydCoder/tinlance-threatfade`
- `LloydCoder/fde-mastery`

Private repositories, credentials and internal infrastructure are never linked as public evidence.

## ThreatFade relationship

Tinlance and ThreatFade are separate public properties. Tinlance describes ThreatFade as a Tinlance-developed security product; ThreatFade maintains its own product identity and public repository. Public ThreatFade product/case-study material identifies Tinlance Limited and links to `https://tinlance.com`; Tinlance links back to the ThreatFade product and repository from its public product, work and engineering surfaces.

ThreatFade evidence such as the early Merlin QUIC result is scoped to its documented historical test population. The public site does not convert that evidence into a universal accuracy, certification or customer-deployment claim.

## Homepage system map

The homepage visual is an architectural **SYSTEM MAP**, not live telemetry. It contains no live counters, simulated events or operational claims. The word `LIVE` must not be used for this visual unless a real telemetry source and update semantics are implemented and documented.
