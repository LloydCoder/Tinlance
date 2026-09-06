export type LegacyDisposition = "A" | "B" | "C" | "D" | "E";

export type LegacyUrlRecord = {
  legacyUrl: string;
  classification: LegacyDisposition;
  currentCanonical: string | null;
  disposition: "preserve" | "transform" | "consolidate" | "retire" | "redirect";
  reason: string;
  claimStatus: "verified" | "historical-verified" | "needs-context" | "outdated" | "not-applicable";
  assetStatus: "none" | "site-assets" | "external" | "needs-recovery";
  verification: "observed" | "implemented" | "requires-deployment-check";
};

/**
 * Authoritative migration contract for the legacy tinlance.com URL set.
 *
 * The live legacy homepage was crawlable during the September 2026 audit and
 * exposed the PHP navigation below. Individual PHP endpoints returned cache
 * misses to the web fetcher, so page-body claims for those endpoints are not
 * treated as recovered facts. Indexed article evidence and the live homepage
 * are recorded separately in docs/migrations/.
 */
export const legacyUrlMap: readonly LegacyUrlRecord[] = [
  { legacyUrl: "/", classification: "A", currentCanonical: "/", disposition: "preserve", reason: "Primary company entry point; modern homepage remains canonical.", claimStatus: "needs-context", assetStatus: "site-assets", verification: "observed" },
  { legacyUrl: "/services.php", classification: "B", currentCanonical: "/services", disposition: "redirect", reason: "Legacy service catalogue is consolidated into the current service architecture.", claimStatus: "needs-context", assetStatus: "site-assets", verification: "implemented" },
  { legacyUrl: "/work.php", classification: "B", currentCanonical: "/work", disposition: "redirect", reason: "Proof-of-work content is consolidated into the current work route.", claimStatus: "needs-context", assetStatus: "site-assets", verification: "implemented" },
  { legacyUrl: "/threatfade.php", classification: "B", currentCanonical: "/threatfade", disposition: "redirect", reason: "ThreatFade has a canonical modern product page and dedicated research evidence route.", claimStatus: "historical-verified", assetStatus: "site-assets", verification: "implemented" },
  { legacyUrl: "/about.php", classification: "B", currentCanonical: "/about", disposition: "redirect", reason: "Company information is consolidated into the current about page.", claimStatus: "needs-context", assetStatus: "site-assets", verification: "implemented" },
  { legacyUrl: "/blog.php", classification: "C", currentCanonical: "/insights", disposition: "redirect", reason: "Legacy blog index is consolidated into the current insights authority layer.", claimStatus: "needs-context", assetStatus: "site-assets", verification: "implemented" },
  { legacyUrl: "/blog.php?slug=threatfade-quic-c2-detection", classification: "B", currentCanonical: "/research/threatfade-quic-c2-detection", disposition: "redirect", reason: "Indexed ThreatFade research article has a dedicated canonical research URL.", claimStatus: "historical-verified", assetStatus: "site-assets", verification: "implemented" },
  { legacyUrl: "/blog?slug=threatfade-quic-c2-detection", classification: "B", currentCanonical: "/research/threatfade-quic-c2-detection", disposition: "redirect", reason: "Indexed query-string ThreatFade article maps directly to the canonical research URL.", claimStatus: "historical-verified", assetStatus: "site-assets", verification: "implemented" },
  { legacyUrl: "/pricing.php", classification: "B", currentCanonical: "/pricing", disposition: "redirect", reason: "Pricing is modernized around assessment-led scoped proposals rather than unverified historical rate cards.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/faq.php", classification: "B", currentCanonical: "/faq", disposition: "redirect", reason: "FAQ is rebuilt around the current assessment, delivery, security, and engagement model.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/client/login.php", classification: "E", currentCanonical: "/sign-in", disposition: "redirect", reason: "Legacy client authentication is replaced by the current Better Auth sign-in boundary.", claimStatus: "not-applicable", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/careers.php", classification: "B", currentCanonical: "/careers", disposition: "redirect", reason: "Careers remains discoverable as a current company route without inventing open roles.", claimStatus: "not-applicable", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/roadmap.php", classification: "B", currentCanonical: "/roadmap", disposition: "redirect", reason: "Public roadmap information is separated from internal product planning and retained as a current informational page.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/privacy.php", classification: "B", currentCanonical: "/privacy", disposition: "redirect", reason: "Legal information is mapped to a current privacy route instead of being dumped onto contact.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/terms.php", classification: "B", currentCanonical: "/terms", disposition: "redirect", reason: "Terms remain a first-class legal route aligned with the current application boundary.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/unsubscribe.php", classification: "E", currentCanonical: "/unsubscribe", disposition: "redirect", reason: "Legacy unsubscribe intent is preserved as a dedicated route.", claimStatus: "not-applicable", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/rss.php", classification: "E", currentCanonical: "/feed.xml", disposition: "redirect", reason: "Legacy RSS endpoint maps to the current feed route.", claimStatus: "not-applicable", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/changelog.php", classification: "C", currentCanonical: "/changelog", disposition: "redirect", reason: "Changelog remains discoverable as a current route while long-form research remains under insights/research.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/press.php", classification: "B", currentCanonical: "/press", disposition: "redirect", reason: "Press information is retained as a concise current company resource without unsupported media claims.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/partners.php", classification: "B", currentCanonical: "/partners", disposition: "redirect", reason: "Partner information is retained as a current route and mapped to the commercial/contact model.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/sitemap-html.php", classification: "E", currentCanonical: "/sitemap.xml", disposition: "redirect", reason: "Machine-readable sitemap is the canonical crawl-discovery mechanism; no duplicate HTML sitemap is required.", claimStatus: "not-applicable", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/cookies.php", classification: "B", currentCanonical: "/cookies", disposition: "redirect", reason: "Cookie information is retained as a current legal route.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
  { legacyUrl: "/blog", classification: "C", currentCanonical: "/insights", disposition: "redirect", reason: "Legacy blog path is consolidated into the current insights index.", claimStatus: "needs-context", assetStatus: "none", verification: "implemented" },
] as const;

export const legacyRedirectDestinations = Object.fromEntries(
  legacyUrlMap
    .filter((record) => record.disposition === "redirect" && record.currentCanonical)
    .map((record) => [record.legacyUrl, record.currentCanonical as string]),
);
