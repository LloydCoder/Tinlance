import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Practical guides for teams building, deploying, and securing production AI systems.",
  alternates: { canonical: "/guides" },
};

const guides = [
  {
    title: "Production AI security review",
    description:
      "A practical review sequence covering identity, tool permissions, data boundaries, retrieval, evaluation, auditability, and high-impact actions.",
    href: "/insights/securing-ai-agents",
  },
  {
    title: "Moving an AI system from prototype to production",
    description:
      "A systems view of reliability, observability, security, evaluation, human controls, and operational ownership.",
    href: "/insights/building-production-ai-systems",
  },
  {
    title: "Understanding Forward-Deployed Engineering",
    description:
      "How embedded engineering connects a customer's workflow and constraints to a working technical outcome.",
    href: "/insights/what-fde-means",
  },
];

export default function GuidesPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
          <p className="kicker kicker-dark">GUIDES</p>
          <h1 style={{ maxWidth: "900px", marginTop: "1rem" }}>Practical engineering guidance, not keyword pages.</h1>
          <p style={{ maxWidth: "760px", fontSize: "1.15rem", marginTop: "1.5rem" }}>
            Guides are curated from Tinlance engineering work and research. Each guide points to a deeper source instead of creating thin variations of the same topic.
          </p>
        </div>
      </section>
      <section className="section-v2">
        <div className="container">
          <div className="content-grid">
            {guides.map((guide) => (
              <article className="content-card" key={guide.href}>
                <h2>{guide.title}</h2>
                <p style={{ marginTop: "1rem" }}>{guide.description}</p>
                <Link className="text-link" href={guide.href} style={{ marginTop: "1.5rem" }}>
                  Read guide source <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-16 border-t border-neutral-200 pt-12">
        <p className="kicker">HOW TO USE THESE GUIDES</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold">Start with the operating problem, then follow the evidence.</h2>
        <p className="mt-5 max-w-3xl leading-7 text-neutral-600">The guides are entry points into longer engineering explanations. They are intended to help technical leaders and practitioners identify the questions that matter—identity, permissions, data boundaries, reliability, evaluation, observability, and operational ownership—before selecting tools or committing to an implementation.</p>
        <p className="mt-4 max-w-3xl leading-7 text-neutral-600">Each guide links to its underlying insight so readers can review the assumptions and context. For a system-specific recommendation, use the technical assessment rather than treating general guidance as a substitute for architecture review.</p>
        <Link className="text-link mt-6 inline-flex" href="/assessment">Discuss your system <ArrowUpRight size={16} /></Link>
      </section>
    </main>
  );
}
