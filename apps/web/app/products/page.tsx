import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { EvidenceStatusBadge } from "../../components/evidence-status";
import { evidenceRecords } from "../../lib/evidence/taxonomy";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore Tinlance products and productized engineering platforms with explicit evidence boundaries.",
  alternates: { canonical: "/products" },
  openGraph: { title: "Products | Tinlance", description: "ThreatFade, FDE Mastery and governed agent infrastructure from Tinlance.", url: "/products", type: "website" },
  twitter: { card: "summary", title: "Products | Tinlance", description: "Public products and productized engineering capabilities from Tinlance." },
};

const products = [
  {
    name: "ThreatFade",
    status: "Public / Open Core",
    evidence: evidenceRecords.threatfadeQuicBaseline,
    problem: "Adversarial activity can intentionally become less observable.",
    capability: "Evidence-first detection and investigation for signal reduction, including C2 quieting, LOTL fade and GNSS interference scenarios.",
    href: "https://threatfade.com",
    repo: "https://github.com/LloydCoder/tinlance-threatfade",
    label: "Visit ThreatFade",
  },
  {
    name: "FDE Mastery",
    status: "Public / Engineering Platform",
    evidence: evidenceRecords.fdeMasteryEngineering,
    problem: "AI workflows need domain contracts, controls and evidence rather than model/API experiments alone.",
    capability: "A reusable FDE platform spanning eight first-class domains with identity, authorization, policy, durable workflows, evaluation, observability and controlled high-impact actions.",
    href: "https://github.com/LloydCoder/fde-mastery",
    repo: "https://github.com/LloydCoder/fde-mastery",
    label: "View FDE Mastery",
  },
  {
    name: "Tinlance Agent Platform",
    status: "Private / M0 in progress",
    evidence: null,
    problem: "Governed agent execution needs generic security and execution primitives without giving models implicit authority.",
    capability: "A private proprietary control substrate. Public implementation details are intentionally limited while the foundation is being built.",
    href: "/engineering",
    repo: undefined,
    label: "View public architecture",
  },
];

export default function ProductsPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }])} />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">TINLANCE / PRODUCTS</p>
          <h1 style={{ maxWidth: "960px" }}>Products with explicit evidence boundaries.</h1>
          <p style={{ maxWidth: "760px", fontSize: "1.2rem", marginTop: "1.5rem" }}>Each product has a clear identity, public/private boundary and evidence status. A repository or test result is never presented as customer proof.</p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="capability-grid">
            {products.map((product) => (
              <article className="capability-card" key={product.name} style={{ minHeight: "430px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <span className="capability-index">{product.status.toUpperCase()}</span>
                  {product.evidence && <EvidenceStatusBadge status={product.evidence.status} />}
                </div>
                <div className="capability-card-body">
                  <h2>{product.name}</h2>
                  <p><strong>Problem:</strong> {product.problem}</p>
                  <p style={{ marginTop: "1rem" }}><strong>Capability:</strong> {product.capability}</p>
                  {product.evidence && <p style={{ marginTop: "1rem" }}><strong>Evidence scope:</strong> {product.evidence.scope}</p>}
                  {product.evidence?.limitations && <p style={{ marginTop: "1rem" }}><strong>Limitation:</strong> {product.evidence.limitations}</p>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem" }}>
                    <a className="text-link" href={product.href} target={product.href.startsWith("http") ? "_blank" : undefined} rel={product.href.startsWith("http") ? "noreferrer" : undefined}>
                      {product.label} <ExternalLink size={16} />
                    </a>
                    {product.repo && <a className="text-link" href={product.repo} target="_blank" rel="noreferrer" aria-label={`${product.name} GitHub repository`}>GitHub repository <ArrowUpRight size={16} /></a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <div className="section-intro-v2 compact">
            <div><p className="kicker">THREATFADE ↔ TINLANCE</p><h2>Separate product.<br /><span>Clear relationship.</span></h2></div>
            <p>ThreatFade is a distinct security product developed by Tinlance. Tinlance provides the engineering context; ThreatFade keeps its own product identity and public repository.</p>
          </div>
          <div className="assessment-card">
            <div><p className="kicker">PUBLIC PROPERTIES</p><h2>Inspect both sides of the <span>relationship.</span></h2><p>Explore the public ThreatFade product and repository, or return to Tinlance for the broader engineering and FDE platform context.</p></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <a className="button button-accent" href="https://threatfade.com" target="_blank" rel="noreferrer">ThreatFade <ExternalLink size={16} /></a>
              <Link className="button button-outline" href="/engineering">Tinlance engineering <ArrowUpRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
