import capabilities from "@/content/capabilities.json";
import evidence from "@/content/evidence-registry.json";
import claims from "@/content/claim-registry.json";

export type Capability = (typeof capabilities.capabilities)[number];
export type Evidence = (typeof evidence.evidence)[number];
export type Claim = (typeof claims.claims)[number];

export function getPublicCapabilities() {
  return capabilities.capabilities.filter((item) => item.customerVisible).map(({ id, slug, name, description, category, status, maturity, availability, publicUrl, evidenceIds, commerciallyAvailable, limitations }) => ({ id, slug, name, description, category, status, maturity, availability, publicUrl, evidenceIds, commerciallyAvailable, limitations }));
}
export function getCapability(slug: string) { return capabilities.capabilities.find((item) => item.slug === slug) ?? null; }
export function getEvidence(id: string) { return evidence.evidence.find((item) => item.id === id) ?? null; }
export function getClaim(id: string) { return claims.claims.find((item) => item.id === id) ?? null; }
export function getPublicEvidenceForCapability(slug: string) { return evidence.evidence.filter((item) => item.capabilitySlug === slug).map(({ id, evidenceType, source, repository, path, workflow, result, scope, limitations, status }) => ({ id, evidenceType, source, repository, path, workflow, result, scope, limitations, status })); }
