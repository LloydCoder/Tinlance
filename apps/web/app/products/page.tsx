import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore Tinlance products and productized engineering platforms, including ThreatFade, FDE Mastery, and the private Agent Platform.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Products | Tinlance",
    description: "ThreatFade, FDE Mastery, and governed agent infrastructure from Tinlance.",
    url: "/products",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Products | Tinlance",
    description: "Public products and productized engineering capabilities from Tinlance.",
  },
};

const products = [
  {
    name: "ThreatFade",
    status: "Public / Open Core",
    problem: "Adversarial activity can intentionally become less observable.",
    capability: "Evidence-first detection and investigation for signal reduction, including C2 quieting, LOTL fade and GNSS interference scenarios.",
    href: "https://threatfade.com",
    repo: "https://github.com/LloydCoder/tinlance-threatfade",
    external: true,
  },
  {
    name: "FDE Mastery",
    status: "Public / Engineering Platform",
    problem: "AI workflows need domain contracts, controls and evidence rather than model/API experiments alone.",
    capability: "A reusable FDE platform spanning eight first-class domains with identity, authorization, policy, durable workflows, evaluation, observability and controlled high-impact actions.",
    href: "https://github.com/LloydCoder/fde-mastery",
    repo: "https://github.com/LloydCoder/fde-mastery",
    external: true,
  },
  {
    name: "Tinlance Agent Platform",
    status: "Private / M0 in progress",
    problem: "Governed agent execution needs generic security and execution primitives without giving models implicit authority.",
    capability: "A private proprietary control substrate for identity, authorization, policy, approvals, budgets, isolation, evidence and audit. Public implementation details are intentionally limited while the foundation is being built.",
    href: "/engineering",
    repo: undefined,
    external: false,
  },
];

export default function ProductsPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }])} />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">TINLANCE / PRODUCTS</p>
          <h1 style={{ maxWidth: "960px" }}>Products built from real engineering problems.</h1>
          <p style={{ maxWidth: "760px", fontSize: "1.2rem", marginTop: "1.5rem" }}>
            Tinlance combines delivery capability with productized systems. Each product has a clear boundary and an explicit evidence status.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="capability-grid">
            {products.map((product) => (
              <article className="capability-card" key={product.name}>
                <span className="capability-index">{product.status.toUpperCase()}</span>
                <div className="capability-card-body">
                  <h2>{product.name}</h2>
                  <p><strong>Problem:</strong> {product.problem}</p>
                  <p style={{ marginTop: "1rem" }}><strong>Capability:</strong> {product.capability}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem" }}>
                    <a className="text-link" href={product.href} target={product.external ? "_blank" : undefined} rel={product.external ? "noreferrer" : undefined}>
                      {product.name === "ThreatFade" ? "Visit product" : product.name === "FDE Mastery" ? "View repository" : "View engineering"} <ExternalLink size={16} />
                    </a>
                    {product.repo && <a className="text-link" href={product.repo} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={16} /></a>}
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
            <div><p className="kicker">PRODUCT ECOSYSTEM</p><h2>Services create evidence. <span>Evidence informs products.</span></h2></div>
            <p>Productization is deliberately controlled: repeated problems become reusable workflows, playbooks and software only after the engineering and security boundaries are clear.</p>
          </div>
          <div className="assessment-card">
            <div><p className="kicker">NEXT STEP</p><h2>Have a problem worth <span>engineering?</span></h2><p>Use the Technical Assessment to establish the workflow, constraints, architecture and evidence required for the right engagement.</p></div>
            <Link className="button button-accent button-large" href="/assessment">Start an assessment <ArrowUpRight size={18} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
