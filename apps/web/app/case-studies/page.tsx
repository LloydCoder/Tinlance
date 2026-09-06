import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { caseStudies } from "../../lib/authority";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Tinlance case studies, with outcomes and evidence classified by provenance. Customer results are published only when supported by evidence.",
  alternates: { canonical: "/case-studies" },
};

export default function CaseStudiesPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Case Studies", path: "/case-studies" },
        ])}
      />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
          <p className="kicker kicker-dark">CASE STUDIES</p>
          <h1 style={{ maxWidth: "900px", marginTop: "1rem" }}>Outcomes only when the evidence supports them.</h1>
          <p style={{ maxWidth: "760px", fontSize: "1.15rem", marginTop: "1.5rem" }}>
            Tinlance does not publish invented customer metrics, testimonials, timelines, or security outcomes. Published case studies identify the provenance and limits of their evidence.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          {caseStudies.length === 0 ? (
            <div className="assessment-card">
              <div>
                <p className="kicker">PUBLIC CASE STUDY STATUS</p>
                <h2>No customer case study is published yet.</h2>
                <p>
                  The reusable case-study schema is live, but Tinlance will not turn internal projects or historical experiments into customer case studies without publishable evidence and appropriate confidentiality approval.
                </p>
              </div>
              <Link className="button button-accent button-large" href="/work">
                See engineering proof <ArrowUpRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="content-grid">
              {caseStudies.map((study) => (
                <article className="content-card" key={study.slug}>
                  <p className="kicker">{study.status.replaceAll("_", " ")}</p>
                  <h2 style={{ marginTop: "0.75rem" }}>{study.title}</h2>
                  <p style={{ marginTop: "1rem" }}>{study.summary}</p>
                  <Link className="text-link" href={study.canonicalPath} style={{ marginTop: "1.5rem" }}>
                    Read case study <ArrowUpRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
