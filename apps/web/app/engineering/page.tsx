import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { EvidenceStatusBadge, EvidenceStatusLegend } from "../../components/evidence-status";
import { architectureFlows, architectureModules, evidenceTypeLabel } from "../../lib/evidence/registry";

export const metadata: Metadata = {
  title: "Engineering Evidence & Architecture",
  description: "A public, evidence-scoped view of Tinlance architecture, engineering boundaries and technical proof.",
  alternates: { canonical: "/engineering" },
  openGraph: { title: "Engineering Evidence & Architecture | Tinlance", description: "Public engineering architecture and evidence for Tinlance AI/FDE systems.", url: "/engineering", type: "website" },
  twitter: { card: "summary", title: "Engineering Evidence & Architecture | Tinlance", description: "Public engineering architecture and evidence for Tinlance AI/FDE systems." },
};

const publicRepositories = [
  ["ThreatFade", "https://github.com/LloydCoder/tinlance-threatfade", "Open-source security engineering evidence."],
  ["FDE Mastery", "https://github.com/LloydCoder/fde-mastery", "Public FDE platform engineering evidence."],
] as const;

export default function EngineeringPage() {
  const moduleById = new Map(architectureModules.map((module) => [module.id, module]));
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Engineering", path: "/engineering" }])} />
      <section className="section-v2 dark-section"><div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}><p className="kicker kicker-dark">TINLANCE / ENGINEERING EVIDENCE</p><h1 style={{ maxWidth: "980px" }}>A public architecture map with a claim-to-evidence boundary.</h1><p style={{ maxWidth: "780px", fontSize: "1.2rem", marginTop: "1.5rem" }}>This is a public abstraction of platform responsibilities and trust boundaries. It is not a production topology, customer environment, or infrastructure disclosure.</p></div></section>
      <section className="section-v2"><div className="container"><div className="section-intro-v2"><div><p className="kicker">01 / ARCHITECTURE MAP</p><h2>Connected layers.<br /><span>Explicit boundaries.</span></h2></div><p>The system is intentionally not presented as a single linear runtime. Commercial, delivery, API, security, evaluation, execution, knowledge and productization boundaries interact through defined control relationships.</p></div>
        <div className="architecture-module-list" aria-label="Tinlance public architecture map">
          {architectureModules.map((module, index) => <article key={module.id} className="capability-card architecture-module"><span className="capability-index">{module.id}</span><div><h3 style={{ marginBottom: "6px" }}>{module.name}</h3><p>{module.purpose}</p><p style={{ marginTop: "8px", fontSize: ".78rem" }}><strong>Boundary:</strong> {module.boundary}</p></div><EvidenceStatusBadge status={module.status} />{index < architectureModules.length - 1 && <span aria-hidden="true" style={{ position: "absolute", left: "44px", bottom: "-18px", zIndex: 2 }}>↓</span>}</article>)}
        </div>
        <p style={{ marginTop: "18px", color: "#626a64", fontSize: ".88rem" }}>The downward sequence is a reading order, not a claim that every module is a runtime dependency of the next. Cross-links and control relationships are listed below.</p>
      </div></section>

      <section className="section-v2 proof-section"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">02 / CONTROL RELATIONSHIPS</p><h2>Architecture as <span>evidence.</span></h2></div><p>These relationships describe public responsibility boundaries without exposing private infrastructure.</p></div><div className="architecture-flow-grid">{architectureFlows.map(([from, to, description]) => <article className="capability-card" key={`${from}-${to}`} style={{ minHeight: "220px" }}><span className="capability-index">{from} → {to}</span><div className="capability-card-body"><h3>{moduleById.get(from)?.name ?? from}</h3><p>{description}</p></div></article>)}</div></div></section>

      <section className="section-v2"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">03 / EVIDENCE TAXONOMY</p><h2>Know what <span>the status means.</span></h2></div><p>Status is not decoration. It describes the strength and scope of evidence behind a claim.</p></div><EvidenceStatusLegend /><div className="capability-grid" style={{ marginTop: "3rem" }}>{Object.entries(evidenceTypeLabel).map(([type, label]) => <article className="capability-card" key={type} style={{ minHeight: "170px" }}><span className="capability-index">EVIDENCE TYPE</span><div className="capability-card-body"><h3>{label}</h3><p>{type === "PRODUCTION_EVIDENCE" ? "Reserved for actual production evidence; repository tests alone do not qualify." : "A defined evidence source used to scope technical claims."}</p></div></article>)}</div></div></section>

      <section className="section-v2 proof-section"><div className="container"><div className="section-intro-v2 compact"><div><p className="kicker">04 / PUBLIC REPOSITORIES</p><h2>Inspect the <span>implementation.</span></h2></div><p>Only public repositories are linked. Private platform repositories and internal implementation details are intentionally excluded.</p></div><div className="capability-grid">{publicRepositories.map(([name, url, description]) => <article className="capability-card" key={name} style={{ minHeight: "240px" }}><span className="capability-index">PUBLIC REPOSITORY</span><div className="capability-card-body"><h3>{name}</h3><p>{description}</p></div><a className="text-link" href={url} target="_blank" rel="noreferrer" aria-label={`${name} GitHub repository`} style={{ marginTop: "18px" }}>GitHub repository <ExternalLink size={16} /></a></article>)}</div><div className="assessment-card" style={{ marginTop: "4rem" }}><div><p className="kicker">ENGINEERING → ASSESSMENT</p><h2>Public architecture meets the <span>real environment.</span></h2><p>Use a technical assessment to establish environment-specific workflow, architecture, security constraints, evidence and outcomes.</p></div><Link className="button button-accent button-large" href="/assessment">Start a technical assessment <ArrowUpRight size={18} /></Link></div></div></section>
    </main>
  );
}
