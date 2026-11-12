import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Public documentation for Tinlance services, FDE boundaries, security posture, research evidence, and engagement paths.",
  alternates: { canonical: "/documentation" },
};

const sections = [
  {
    title: "What Tinlance does",
    description: "AI engineering, Forward-Deployed Engineering, AI security, and enterprise automation.",
    href: "/services",
  },
  {
    title: "How FDE fits",
    description: "Tinlance is the commercial and customer-facing layer; FDE Mastery remains the execution methodology and platform authority.",
    href: "/services/forward-deployed-engineering",
  },
  {
    title: "Security and evidence",
    description: "Current security boundaries and public research are documented separately from private operational controls and customer data.",
    href: "/research",
  },
  {
    title: "How to engage",
    description: "The technical assessment is the primary path from technical discovery to qualification and the commercial workflow.",
    href: "/assessment",
  },
];

export default function DocumentationPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Documentation", path: "/documentation" },
        ])}
      />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
          <p className="kicker kicker-dark">DOCUMENTATION</p>
          <h1 style={{ maxWidth: "900px", marginTop: "1rem" }}>A public map of the current Tinlance system.</h1>
          <p style={{ maxWidth: "760px", fontSize: "1.15rem", marginTop: "1.5rem" }}>
            Public documentation explains stable concepts and boundaries. Internal implementation details, tenant data, credentials, and operational secrets remain outside the public authority layer.
          </p>
        </div>
      </section>
      <section className="section-v2">
        <div className="container">
          <div className="content-grid">
            {sections.map((section) => (
              <article className="content-card" key={section.href}>
                <h2>{section.title}</h2>
                <p style={{ marginTop: "1rem" }}>{section.description}</p>
                <Link className="text-link" href={section.href} style={{ marginTop: "1.5rem" }}>
                  Open documentation <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-16 border-t border-neutral-200 pt-12">
        <p className="kicker">PUBLIC DOCUMENTATION BOUNDARY</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold">Stable concepts are public; customer operations are not.</h2>
        <p className="mt-5 max-w-3xl leading-7 text-neutral-600">This documentation hub is intended to explain public service capabilities, technical terminology, and supported integration paths. It does not publish customer-specific architecture, tenant data, credentials, private incident records, or internal operational runbooks.</p>
        <p className="mt-4 max-w-3xl leading-7 text-neutral-600">For developers, the API documentation describes the public contract and integration expectations. Access to authenticated operations remains subject to organization-scoped credentials, server-side authorization, and the permissions granted to the calling identity.</p>
        <Link className="text-link mt-6 inline-flex" href="/docs/api">Read API documentation <ArrowUpRight size={16} /></Link>
      </section>
    </main>
  );
}
