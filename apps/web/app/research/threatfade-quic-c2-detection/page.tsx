import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../../components/json-ld";
import { getAuthor, researchItems } from "../../../lib/authority";

const research = researchItems[0];
const author = getAuthor(research.authors[0]);

export const metadata: Metadata = {
  title: "ThreatFade QUIC C2 Detection | Tinlance Research",
  description: research.summary,
  authors: [{ name: author?.name ?? "Tinlance Engineering" }],
  alternates: { canonical: research.canonicalPath },
  openGraph: {
    type: "article",
    title: research.title,
    description: research.summary,
    url: `https://tinlance.com${research.canonicalPath}`,
    publishedTime: research.publishedAt,
    modifiedTime: research.updatedAt,
    authors: [author?.name ?? "Tinlance Engineering"],
  },
};

const researchSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: research.title,
  description: research.summary,
  datePublished: research.publishedAt,
  dateModified: research.updatedAt,
  author: {
    "@type": "Organization",
    name: author?.name ?? "Tinlance Engineering",
    url: author?.url ?? "https://tinlance.com/about",
  },
  publisher: { "@id": "https://tinlance.com/#organization" },
  mainEntityOfPage: `https://tinlance.com${research.canonicalPath}`,
  about: ["ThreatFade", "QUIC", "C2 detection", "AI security"],
};

export default function ThreatFadeResearchPage() {
  return (
    <main>
      <JsonLd
        data={[
          researchSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Research", path: "/research" },
            { name: "ThreatFade QUIC C2 Detection", path: research.canonicalPath },
          ]),
        ]}
      />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
          <p className="kicker kicker-dark">HISTORICAL VERIFIED RESEARCH</p>
          <h1 style={{ maxWidth: "980px", marginTop: "1rem" }}>{research.title}</h1>
          <p style={{ maxWidth: "780px", fontSize: "1.15rem", marginTop: "1.5rem" }}>{research.summary}</p>
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
            Published {research.publishedAt} · reviewed {research.reviewedAt} · {author?.name ?? "Tinlance Engineering"}
          </p>
        </div>
      </section>

      <article className="section-v2">
        <div className="container" style={{ maxWidth: "820px" }}>
          <div className="article-body">
            <h2>Abstract</h2>
            <p>{research.abstract}</p>

            <h2>Research question</h2>
            <p>{research.researchQuestion}</p>

            <h2>Context</h2>
            <p>{research.context}</p>

            <h2>Methodology</h2>
            <ul>{research.methodology.map((item) => <li key={item}>{item}</li>)}</ul>

            <h2>Dataset and environment</h2>
            <p><strong>Dataset:</strong> {research.dataset}</p>
            <p><strong>Environment:</strong> {research.environment}</p>

            <h2>Results</h2>
            <ul>{research.results.map((item) => <li key={item}>{item}</li>)}</ul>

            <h2>Limitations</h2>
            <ul>{research.limitations.map((item) => <li key={item}>{item}</li>)}</ul>

            <h2>Evidence classification</h2>
            <p>
              This page is classified as <strong>{research.status.replaceAll("_", " ")}</strong> with evidence levels: {research.evidence.join(", ")}.
            </p>
            <p>
              The 490,847-packet, Merlin QUIC C2, z-score 14.76 and 0% false-positive figures are historical MVP experiment results scoped to the tested populations. They are not a universal production guarantee.
            </p>

            <h2>References</h2>
            <ul>{research.references.map((reference) => <li key={reference}><a href={reference} rel="noreferrer">{reference}</a></li>)}</ul>
          </div>

          <div className="assessment-card" style={{ marginTop: "4rem" }}>
            <div>
              <p className="kicker">APPLY THE RESEARCH</p>
              <h2>Need to investigate AI or security risk in a real system?</h2>
              <p>Move from public evidence to an environment-specific technical assessment.</p>
            </div>
            <Link className="button button-accent button-large" href="/assessment">
              Book a technical assessment <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
