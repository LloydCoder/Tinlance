import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, ShieldCheck } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { EvidenceStatusBadge } from "../../components/evidence-status";
import { caseStudies } from "../../lib/evidence/registry";

export const metadata: Metadata = {
  title: "Work & Engineering Proof",
  description: "Explore Tinlance engineering case studies, open-source validation and public technical evidence without fabricated customer proof.",
  alternates: { canonical: "/work" },
};

const categoryLabel: Record<(typeof caseStudies)[number]["category"], string> = {
  CUSTOMER_CASE_STUDY: "Customer case study",
  ENGINEERING_CASE_STUDY: "Engineering case study",
  OPEN_SOURCE_VALIDATION: "Open-source validation",
  RESEARCH_VALIDATION: "Research validation",
  SYNTHETIC_EVALUATION: "Synthetic evaluation",
  ARCHITECTURE_CASE_STUDY: "Architecture case study",
};

export default function WorkPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }])} />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">TINLANCE / PROOF</p>
          <h1 style={{ maxWidth: "900px" }}>Evidence before customer-story theatre.</h1>
          <p style={{ maxWidth: "720px", fontSize: "1.2rem", marginTop: "1.5rem" }}>We publish engineering, research and open-source evidence with explicit scope. Customer case studies are reserved for real engagements with permission to publish.</p>
        </div>
      </section>
      <section className="section-v2 proof-section">
        <div className="container">
          <div className="proof-feature">
            <div className="proof-feature-main">
              <div className="proof-icon"><ShieldCheck size={24} /></div>
              <p className="kicker">CASE-STUDY TAXONOMY</p>
              <h2>Different evidence types should look different.</h2>
              <p>Every study identifies its type, status, product, problem, approach, evidence, result and limitations. Synthetic evaluation is never presented as customer success.</p>
            </div>
            <div className="proof-metrics">
              <div><strong>{String(caseStudies.length).padStart(2, "0")}</strong><span>Published evidence records</span></div>
              <div><strong>0</strong><span>Fabricated customer studies</span></div>
              <div><strong>6</strong><span>Supported case-study types</span></div>
            </div>
          </div>
        </div>
      </section>
      <section className="section-v2">
        <div className="container">
          <div className="capability-grid">
            {caseStudies.filter((study) => study.public).map((study) => (
              <article className="capability-card" key={study.id} style={{ minHeight: "430px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <span className="capability-index">{categoryLabel[study.category].toUpperCase()}</span>
                  <EvidenceStatusBadge status={study.status} />
                </div>
                <div className="capability-card-body" style={{ marginTop: "28px" }}>
                  <h2>{study.title}</h2>
                  <p><strong>Product:</strong> {study.product}{study.domain ? ` · ${study.domain}` : ""}</p>
                  <p style={{ marginTop: "1rem" }}><strong>Problem:</strong> {study.problem}</p>
                  <p style={{ marginTop: "1rem" }}><strong>Approach:</strong> {study.approach}</p>
                  <p style={{ marginTop: "1rem" }}><strong>Evidence:</strong> {study.evidence}</p>
                  <p style={{ marginTop: "1rem" }}><strong>Result:</strong> {study.result}</p>
                  <p style={{ marginTop: "1rem" }}><strong>Scope / limitations:</strong> {study.scope} {study.limitations}</p>
                </div>
                {study.sourceUrl && <a className="text-link" href={study.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${study.title} public source`} style={{ marginTop: "18px" }}>View source <ExternalLink size={16} /></a>}
              </article>
            ))}
          </div>
          <div className="assessment-card" style={{ marginTop: "4rem" }}>
            <div><p className="kicker">NEXT STEP</p><h2>Validate your own <span>system.</span></h2><p>Move from public engineering evidence to an environment-specific technical assessment.</p></div>
            <Link className="button button-accent button-large" href="/assessment">Book an assessment <ArrowUpRight size={18} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
