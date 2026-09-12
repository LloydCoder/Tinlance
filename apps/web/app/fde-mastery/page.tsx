import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";

export const metadata: Metadata = {
  title: "FDE Mastery",
  description: "FDE Mastery is Tinlance's domain-oriented engineering layer for governed AI workflows, evidence, validation, and controlled actions.",
  alternates: { canonical: "/fde-mastery" },
  openGraph: {
    title: "FDE Mastery | Tinlance",
    description: "A domain-oriented FDE platform for governed AI workflows and enterprise automation.",
    url: "/fde-mastery",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FDE Mastery | Tinlance",
    description: "Domain contracts, workflow execution, evidence and controlled actions for enterprise AI systems.",
  },
};

const domains = [
  "Cybersecurity",
  "Finance / Fintech",
  "HealthTech",
  "Logistics",
  "LegalTech",
  "RevOps",
  "Procurement",
  "Custom",
];

const principles = [
  ["Domain contracts", "Each domain has an explicit contract and workflow boundary rather than a generic industry label."],
  ["Controlled execution", "Workflows connect context, agents, approved tools, policy, human approval and action."],
  ["Evidence", "Execution and decision lineage preserve evidence references, approvals and operational state without exposing hidden chain-of-thought."],
  ["Evaluation", "Golden, adversarial, safety, quality, cost and promotion gates are part of the platform's engineering model."],
  ["Human control", "High-impact actions remain subject to authorized human review and domain-specific controls."],
  ["Integration boundaries", "Tinlance remains the commercial/customer-facing layer; the FDE API provides the authenticated boundary into FDE Mastery."],
];

export default function FdeMasteryPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "FDE Mastery", path: "/fde-mastery" }])} />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">TINLANCE / FDE MASTERY</p>
          <h1 style={{ maxWidth: "980px" }}>A domain-oriented engineering layer for governed AI workflows.</h1>
          <p style={{ maxWidth: "780px", fontSize: "1.2rem", marginTop: "1.5rem" }}>
            FDE Mastery is designed to move AI from model/API experimentation into workflows with explicit domain contracts, validation, evidence, security boundaries and controlled actions.
          </p>
          <div className="hero-actions" style={{ marginTop: "2rem" }}>
            <Link className="button button-accent button-large" href="/assessment">Technical assessment <ArrowUpRight size={17} /></Link>
            <a className="button button-outline button-large" href="https://github.com/LloydCoder/fde-mastery" target="_blank" rel="noreferrer">Public repository <ArrowUpRight size={17} /></a>
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2">
            <div><p className="kicker">01 / THE FDE MODEL</p><h2>Tinlance → FDE API → <span>domain contract.</span></h2></div>
            <p>The web platform handles commercial and customer-facing concerns. The authenticated FDE boundary validates tenant/domain context before execution reaches FDE Mastery.</p>
          </div>
          <div className="proof-feature">
            <div className="proof-feature-main">
              <p className="kicker">EXECUTION LOOP</p>
              <h3>Domain Contract → Workflow / Triage → Approved Tools → Policy → Evidence → Human Decision where required</h3>
              <p>The platform is intentionally designed around governed execution rather than autonomous action by default.</p>
            </div>
            <div className="proof-metrics">
              <div><strong>08</strong><span>First-class domains</span></div>
              <div><strong>30</strong><span>Repository build history</span></div>
              <div><strong>HITL</strong><span>High-impact action boundary</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <p className="kicker">02 / DOMAIN CONTRACTS</p>
          <div className="capability-grid">
            {domains.map((domain, index) => (
              <article className="capability-card" key={domain}>
                <span className="capability-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="capability-card-body"><h3>{domain}</h3><p>First-class FDE domain contract in the public FDE Mastery repository.</p></div>
              </article>
            ))}
          </div>
          <p style={{ marginTop: "1.5rem", color: "var(--muted)" }}>These are supported capability/domain contracts, not claims of eight independent production deployments.</p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2 compact">
            <div><p className="kicker">03 / ENGINEERING EVIDENCE</p><h2>Thirty builds. <span>Not thirty customers.</span></h2></div>
            <p>The repository's Build Status records 30 engineering builds through Production Operationalization. That history is engineering evidence, not a customer-deployment count.</p>
          </div>
          <div className="capability-grid">
            {principles.map(([title, text]) => (
              <article className="capability-card" key={title}>
                <span className="capability-index">ENGINEERING PRINCIPLE</span>
                <div className="capability-card-body"><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
          <div className="assessment-card" style={{ marginTop: "4rem" }}>
            <div><p className="kicker">NEXT STEP</p><h2>Turn a real workflow into a <span>controlled system.</span></h2><p>Start with a Technical Assessment to establish domain fit, workflow boundaries, security requirements, evidence needs and the implementation path.</p></div>
            <Link className="button button-accent button-large" href="/assessment">Start a technical assessment <ArrowUpRight size={18} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
