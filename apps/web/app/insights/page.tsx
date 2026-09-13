import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { insights } from "../../lib/content";
import { socialImageUrl, socialImages } from "../../lib/metadata";

export const metadata: Metadata = {
  title: "Insights",
  description: "Practical engineering intelligence on AI engineering, security, Forward-Deployed Engineering, and enterprise automation.",
  alternates: { canonical: "/insights" },
  openGraph: { title: "Insights | Tinlance", description: "Practical engineering intelligence on AI engineering, security, FDE and enterprise automation.", url: "/insights", type: "website", images: socialImages },
  twitter: { card: "summary_large_image", title: "Insights | Tinlance", description: "Practical engineering intelligence on AI engineering, security, FDE and enterprise automation.", images: [socialImageUrl] },
};

export default function InsightsPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Insights", path: "/insights" }])} />
      <section className="section-v2 dark-section"><div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}><p className="kicker kicker-dark">TINLANCE / INSIGHTS</p><h1 style={{ maxWidth: "920px" }}>Engineering intelligence for teams building with AI.</h1><p style={{ maxWidth: "720px", fontSize: "1.2rem", marginTop: "1.5rem" }}>Practical research on production AI, security, forward-deployed engineering, and enterprise automation.</p></div></section>
      <section className="section-v2"><div className="container"><div className="proof-feature"><div className="proof-feature-main"><p className="kicker">RESEARCH / PRACTICE</p><h2>Useful ideas should survive contact with production.</h2><p>Tinlance insights focus on architecture, delivery, security, and operating models that engineering and product teams can actually apply.</p></div><div className="proof-metrics"><div><strong>{String(insights.length).padStart(2, "0")}</strong><span>Published insights</span></div><div><strong>AI</strong><span>Primary research lens</span></div><div><strong>FDE</strong><span>Delivery perspective</span></div></div></div></div></section>
      <section className="section-v2"><div className="container"><div className="capability-grid">{insights.map((insight) => <article key={insight.slug} className="capability-card"><p className="kicker">{insight.category}</p><h2>{insight.title}</h2><p>{insight.excerpt}</p><div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>{insight.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div><p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>{insight.readingTime} · {insight.publishedAt}</p><Link className="text-link" href={`/insights/${insight.slug}`}>Read insight <ArrowUpRight size={16} aria-hidden="true" /></Link></article>)}</div></div></section>
    </main>
  );
}
