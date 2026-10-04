import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../../components/json-ld";
import { EvidenceStatusBadge, EvidenceStatusLegend } from "../../../components/evidence-status";
import { evidenceRecords } from "../../../lib/evidence/taxonomy";
import { socialImageUrl, socialImages } from "../../../lib/metadata";

export const metadata: Metadata = {
  title: "FDSE — Forward-Deployed Software Engineering Intelligence",
  description: "FDSE is Tinlance's engineering intelligence and assurance layer for context, risk, policy, evidence, evaluation, security, supply-chain and engineering lineage.",
  alternates: { canonical: "/engineering/fdse" },
  openGraph: { title: "FDSE — Forward-Deployed Software Engineering Intelligence | Tinlance", description: "Engineering intelligence and assurance for forward-deployed software engineering.", url: "/engineering/fdse", type: "website", images: socialImages },
  twitter: { card: "summary_large_image", title: "FDSE — Forward-Deployed Software Engineering Intelligence | Tinlance", description: "Engineering intelligence and assurance for forward-deployed software engineering.", images: [socialImageUrl] },
};

const layers = [
  ["FDE Mastery", "Domain engineering and delivery capabilities.", "/fde-mastery"],
  ["FDSE", "Engineering context, risk, policy, workflow, evidence, evaluation and assurance semantics.", "/engineering/fdse"],
  ["Agent Platform", "Governed execution authority for identity, authorization, approvals, tools, sandboxing, budgets and audit.", null],
  ["Customer systems", "Repositories, CI/CD, services and operational environments where engineering work occurs.", null],
] as const;

const commercialPosture = [
  ["Assessment-led", "Start with a technical assessment to establish the repository, workflow, security and evidence context before proposing implementation."],
  ["Engagement capability", "FDSE is currently presented as a Tinlance engineering capability delivered through appropriate engagements and enterprise deployments, not as standalone SaaS pricing."],
  ["Evidence-scoped", "Implementation, testing and validation are represented separately; repository evidence is not converted into customer proof or certification claims."],
  ["Platform-separated", "FDSE owns engineering semantics and assurance meaning. Generic execution authority remains outside FDSE and is only described as integrated when verified."],
];

const platformControls = [
  ["Identity & tenant", "The Platform binds authenticated principal and tenant context; FDSE does not create a parallel authority model."],
  ["Capability & policy", "The Platform evaluates capability, policy and risk before consequential execution. Engineering semantics can require controls but cannot grant authority."],
  ["Approval", "High-impact actions can require an authenticated, tenant-scoped, action-bound approval; requester self-approval is rejected by the governed execution contract."],
  ["Execution boundary", "The Platform owns runtime, tool/MCP mediation, sandbox, secrets, budgets, evidence and audit for governed execution."],
  ["Evidence & audit", "Execution results and lifecycle events are bound to the governed run/execution context; FDSE consumes engineering evidence semantics rather than replacing the Platform audit authority."],
  ["Production boundary", "The Platform repository documents reference implementations and contracts. External production infrastructure and adapters must be supplied and verified separately."],
];

const semantics = [
  ["Context", "Bind engineering work to the tenant, repository and immutable revision under consideration."],
  ["Risk", "Relate assets, threats, scenarios, controls, evidence, findings, treatment and residual risk."],
  ["Policy", "Relate requirements, constraints, guardrails, approvals and exceptions."],
  ["Change", "Relate change, impact, risk, required evidence, evaluation, approval and verification."],
  ["Evidence", "Preserve provenance and distinguish observations, evidence, findings, evaluations and assurance."],
  ["Security & supply chain", "Represent agentic security, dependency, build, artifact, provenance, attestation and verification semantics."],
  ["Assurance", "Connect requirements, controls, tests, evidence, results, assurance and certification references without claiming certification by association."],
  ["Lineage & resilience", "Preserve engineering lineage and incident/resilience relationships so changes and outcomes can be reasoned about over time."],
];

export default function FdsePage() {
  const evidence = evidenceRecords.fdsePublicArchitecture;
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Engineering", path: "/engineering" }, { name: "FDSE", path: "/engineering/fdse" }])} />
      <section className="section-v2 dark-section"><div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
        <p className="kicker kicker-dark">TINLANCE / FDSE</p>
        <h1 style={{ maxWidth: "980px" }}>Engineering intelligence and assurance for forward-deployed software engineering.</h1>
        <p style={{ maxWidth: "800px", fontSize: "1.2rem", marginTop: "1.5rem" }}>FDSE is Tinlance's engineering-semantic layer. It structures context, risk, policy, workflow, evidence, evaluation, assurance, security, supply-chain and lineage concerns around engineering work without becoming the generic execution authority.</p>
        <div style={{ marginTop: "1.5rem" }}><EvidenceStatusBadge status="IMPLEMENTED" /></div>
        <div className="hero-actions" style={{ marginTop: "2rem" }}><Link className="button button-accent button-large" href="/assessment">Start a technical assessment <ArrowUpRight size={18} aria-hidden="true" /></Link><a className="button button-outline button-large" href="https://github.com/LloydCoder/tinlance-fdse" target="_blank" rel="noreferrer" aria-label="FDSE public GitHub repository">FDSE repository <ExternalLink size={17} aria-hidden="true" /></a></div>
      </div></section>
      <section className="section-v2"><div className="container"><div className="section-intro-v2"><div><p className="kicker">01 / SYSTEM BOUNDARY</p><h2>Engineering semantics.<br /><span>Governed execution.</span></h2></div><p>FDSE does not replace Tinlance's execution platform. The public architecture separates engineering meaning from generic authority so claims remain scoped to the component that owns them.</p></div>
        <div className="architecture-module-list" aria-label="FDSE responsibility boundary">{layers.map(([name, purpose, href], index) => <article key={name} className="capability-card architecture-module"><span className="capability-index">{String(index + 1).padStart(2, "0")}</span><div><h3 style={{ marginBottom: "6px" }}>{name}</h3><p>{purpose}</p>{href && <Link className="text-link" href={href} style={{ marginTop: "10px" }}>Explore {name}</Link>}</div>{index < layers.length - 1 && <span aria-hidden="true" style={{ position: "absolute", left: "44px", bottom: "-18px", zIndex: 2 }}>↓</span>}</article>)}</div>
        <p style={{ marginTop: "18px", color: "#626a64", fontSize: ".88rem" }}>This is a public responsibility map, not a production topology. The FDSE ↔ Agent Platform relationship is an architectural contract; live production integration is only claimed when independently verified.</p>
      </div></section>
      <section className="section-v2 proof-section"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">02 / ENGINEERING SEMANTICS</p><h2>What FDSE <span>means.</span></h2></div><p>FDSE provides the domain language and evidence relationships needed to reason about engineering work consistently across delivery and assurance workflows.</p></div><div className="capability-grid">{semantics.map(([title, text]) => <article className="capability-card" key={title}><span className="capability-index">FDSE</span><div className="capability-card-body"><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>
      <section className="section-v2"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">03 / HOW TINLANCE USES FDSE</p><h2>From engineering request to <span>assurance.</span></h2></div><p>FDSE is most useful when it is attached to real engineering delivery rather than presented as an abstract taxonomy.</p></div><div className="capability-grid">{commercialPosture.map(([title, text]) => <article className="capability-card" key={title}><span className="capability-index">ENGAGEMENT</span><div className="capability-card-body"><h3>{title}</h3><p>{text}</p></div></article>)}</div><div className="assessment-card" style={{ marginTop: "3rem" }}><div><p className="kicker">COMMERCIAL POSTURE</p><h2>Use FDSE where <span>assurance matters.</span></h2><p>For now, FDSE is an engineering capability within Tinlance engagements. Pricing is scoped with the engineering engagement and customer environment rather than published as a standalone FDSE SaaS tier.</p></div><Link className="button button-accent button-large" href="/assessment">Discuss an engineering assessment <ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></section>
      <section className="section-v2"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">04 / FDE RELATIONSHIP</p><h2>FDE Mastery <span>delivers.</span> FDSE <span>assures.</span></h2></div><p>FDE Mastery remains the domain engineering and delivery layer. FDSE supplies engineering intelligence and assurance semantics around that work; neither is a substitute for the other.</p></div><div className="assessment-card"><div><p className="kicker">FDE → FDSE</p><h2>Turn engineering work into <span>traceable evidence.</span></h2><p>Customer requests can be connected to context, risk, policy, changes, evidence, evaluation and assurance while execution authority remains governed by the appropriate platform boundary.</p></div><Link className="button button-accent button-large" href="/fde-mastery">Explore FDE Mastery <ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></section>
      <section className="section-v2"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">05 / AGENT PLATFORM CONTRACT</p><h2>FDSE defines meaning.<br /><span>Platform defines authority.</span></h2></div><p>The Tinlance Agent Platform is the generic governed execution authority. Its implemented <strong>governed-execution.v1</strong> contract binds identity, tenant, capability, policy, risk, approval, execution, evidence and audit at the consequential side-effect boundary.</p><div className="capability-grid" style={{ marginTop: "2rem" }}>{platformControls.map(([title, text]) => <article className="capability-card" key={title}><span className="capability-index">PLATFORM</span><div className="capability-card-body"><h3>{title}</h3><p>{text}</p></div></article>)}</div><div className="assessment-card" style={{ marginTop: "3rem" }}><div><p className="kicker">PUBLIC CONTRACT EVIDENCE</p><h2>Inspect the <span>governed boundary.</span></h2><p>The public Agent Platform repository documents the authority model and R10 contract. This website relationship is architectural evidence; it is not a claim that FDSE is already connected to a live production Platform deployment.</p></div><div className="hero-actions"><a className="button button-accent button-large" href="https://github.com/LloydCoder/tinlance-agent-platform" target="_blank" rel="noreferrer">Agent Platform repository <ExternalLink size={17} aria-hidden="true" /></a><a className="button button-outline button-large" href="https://github.com/LloydCoder/tinlance-agent-platform/blob/main/docs/R10-GOVERNED-EXECUTION.md" target="_blank" rel="noreferrer">R10 contract <ExternalLink size={17} aria-hidden="true" /></a></div></div></div></div></section>
      <section className="section-v2 proof-section"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">06 / EVIDENCE STATUS</p><h2>Repository evidence is <span>not customer proof.</span></h2></div><p>The repository establishes implementation and contract evidence. Production capability, customer outcomes and independent validation require their own evidence records.</p></div><div className="capability-grid">{[["IMPLEMENTED","Present in the current repository implementation."],["TESTED","Covered by automated or reproducible tests."],["VALIDATED","Supported by documented validation beyond ordinary implementation/testing."],["PLANNED","Intentionally identified for future implementation."]].map(([status, text]) => <article className="capability-card" key={status}><span className="capability-index">STATUS</span><div className="capability-card-body"><h3>{status}</h3><p>{text}</p></div></article>)}</div><p style={{ marginTop: "2rem" }}>See the <Link className="text-link" href="/engineering">full engineering evidence map</Link> and <Link className="text-link" href="/assessment">technical assessment</Link> for environment-specific validation.</p></div></section>
      <section className="section-v2"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">07 / EVIDENCE RECORD</p><h2>Know what the <span>page proves.</span></h2></div><p>The public page is backed by an architecture evidence record and repository CI. That evidence is deliberately narrower than a claim of production integration or customer outcomes.</p></div><div className="assessment-card"><div><p className="kicker">FDSE PUBLIC ARCHITECTURE</p><h2>{evidence.title}</h2><p>{evidence.result} {evidence.limitations}</p></div><EvidenceStatusBadge status={evidence.status} /></div><div style={{ marginTop: "2rem" }}><EvidenceStatusLegend /></div></div></section>
    </main>
  );
}
