import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { authors, researchItems } from "../../lib/authority";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Tinlance technical research, experiments, evidence, methodology, and limitations across AI engineering and AI security.",
  alternates: { canonical: "/research" },
};

export default function ResearchIndexPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Research", path: "/research" },
        ])}
      />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
          <p className="kicker kicker-dark">RESEARCH</p>
          <h1 style={{ maxWidth: "900px", marginTop: "1rem" }}>
            Technical work with the evidence attached.
          </h1>
          <p style={{ maxWidth: "760px", fontSize: "1.15rem", marginTop: "1.5rem" }}>
            Tinlance research separates observed results from interpretation, historical experiments from current capability, and evidence from future work.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="content-grid">
            {researchItems.map((item) => (
              <article className="content-card" key={item.slug}>
                <p className="kicker">{item.status.replaceAll("_", " ")}</p>
                <h2 style={{ marginTop: "0.75rem" }}>{item.title}</h2>
                <p style={{ marginTop: "1rem" }}>{item.summary}</p>
                <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                  {item.publishedAt} · reviewed {item.reviewedAt} · {authors.find((a) => a.id === item.authors[0])?.name ?? "Tinlance Engineering"}
                </p>
                <Link className="text-link" href={item.canonicalPath} style={{ marginTop: "1.5rem" }}>
                  Read the research <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
          <div className="assessment-card" style={{ marginTop: "4rem" }}>
            <div>
              <p className="kicker">FROM RESEARCH TO ENGINEERING</p>
              <h2>Need to validate an AI system in your environment?</h2>
              <p>Bring the architecture, workflow, constraints, and evidence you already have. We can assess the technical path.</p>
            </div>
            <Link className="button button-accent button-large" href="/assessment">
              Book a technical assessment <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
