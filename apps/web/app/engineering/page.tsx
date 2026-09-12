import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";

export const metadata: Metadata = {
  title: "Engineering Evidence & Architecture",
  description: "A public view of Tinlance's current engineering architecture, evidence model, security boundaries, and platform layers.",
  alternates: { canonical: "/engineering" },
  openGraph: {
    title: "Engineering Evidence & Architecture | Tinlance",
    description: "How Tinlance structures commercial delivery, APIs, security, evaluation, agents, knowledge and productization.",
    url: "/engineering",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Engineering Evidence & Architecture | Tinlance",
    description: "Public engineering evidence and architecture for Tinlance AI/FDE systems.",
  },
};

const layers = [
  ["M1", "Commercial Engine", "Assessment → lead → qualification → booking → proposal → engagement.", "Implemented"],
  ["M3", "Customer Workspace", "Tenant-scoped customer delivery and evidence surfaces.", "Implemented"],
  ["M4", "Automation / Core", "Workflow execution authority used by the platform.", "Implemented"],
  ["M5", "API Platform", "Central application/API surface for platform capabilities.", "Implemented"],
  ["M6", "MCP Gateway", "Controlled MCP/tool boundary with authorization-aware execution.", "Implemented"],
  ["M7", "AI Security Gateway", "Identity, tenant, permission, policy, risk, approval, output and audit controls.", "Implemented"],
  ["M8", "Agent Evaluation Platform", "Evaluation and regression authority for AI behavior and release decisions.", "Implemented"],
  ["M9", "Agent Runtime", "Identity-bound, bounded agent execution with memory, approvals and runtime evidence.", "Implemented"],
  ["M10", "Knowledge / RAG", "Knowledge and retrieval authority with explicit tenant/scope boundaries.", "Implemented"],
  ["M11", "AI Sales Engineer", "Grounded public/product information for technical discovery and conversion.", "Implemented"],
  ["M12", "Revenue Intelligence", "Canonical commercial and revenue intelligence source of truth.", "Implemented"],
  ["M13", "Proprietary Knowledge Moat", "Governed intelligence derived from approved delivery evidence.", "Implemented"],
  ["M14", "Consulting → Software", "Observation → pattern → opportunity → playbook → experiment → productization.", "Implemented"],
];

const evidence = [
  ["Public repositories", "ThreatFade and FDE Mastery provide public engineering evidence. Private platform repositories remain private."],
  ["Automated verification", "The repository contains type checking, linting, tests, security scanning, SBOM/container controls and dedicated M6–M9 workflows."],
  ["Architecture evidence", "The canonical architecture documents explicit trust boundaries between the public application, API, FDE boundary and platform control planes."],
  ["Status discipline", "Implemented does not mean customer-production validated. Environment-specific deployment and customer outcomes require separate evidence."],
];

export default function EngineeringPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Engineering", path: "/engineering" }])} />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">TINLANCE / ENGINEERING EVIDENCE</p>
          <h1 style={{ maxWidth: "980px" }}>A public view of the system behind the service.</h1>
          <p style={{ maxWidth: "780px", fontSize: "1.2rem", marginTop: "1.5rem" }}>
            Tinlance is engineered as a connected AI/FDE platform: commercial intake, customer delivery, APIs, security, evaluation, agent execution, knowledge and controlled productization share explicit boundaries.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2">
            <div><p className="kicker">01 / PLATFORM MAP</p><h2>Commercial → customer → <span>controlled execution.</span></h2></div>
            <p>The layer names below reflect the current repository architecture. They describe platform responsibilities, not a claim that every layer is an independent customer-facing product.</p>
          </div>
          <div className="capability-grid">
            {layers.map(([id, title, description, status]) => (
              <article className="capability-card" key={id}>
                <span className="capability-index">{id} · {status.toUpperCase()}</span>
                <div className="capability-card-body"><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <div className="section-intro-v2 compact">
            <div><p className="kicker">02 / EVIDENCE MODEL</p><h2>Show the work. <span>Scope the claim.</span></h2></div>
            <p>Public evidence is intentionally separated from private infrastructure and customer information.</p>
          </div>
          <div className="capability-grid">
            {evidence.map(([title, text]) => (
              <article className="capability-card" key={title}>
                <span className="capability-index">EVIDENCE</span>
                <div className="capability-card-body"><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
          <div className="assessment-card" style={{ marginTop: "4rem" }}>
            <div><p className="kicker">ENGINEERING → ASSESSMENT</p><h2>Architecture should meet the <span>real environment.</span></h2><p>Move from public evidence to an environment-specific technical assessment covering workflow, architecture, security, constraints and outcomes.</p></div>
            <Link className="button button-accent button-large" href="/assessment">Start a technical assessment <ArrowUpRight size={18} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
