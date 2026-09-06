import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbSchema } from "../../../components/json-ld";
import { getAuthor } from "../../../lib/authority";
import { insights } from "../../../lib/content";

type InsightParams = Promise<{ slug: string }>;

export function generateStaticParams() {
  return insights.map((insight) => ({ slug: insight.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: InsightParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const insight = insights.find((item) => item.slug === slug);
  if (!insight) return {};
  return {
    title: insight.title,
    description: insight.excerpt,
    authors: [{ name: insight.author }],
    alternates: { canonical: `/insights/${insight.slug}` },
    openGraph: {
      type: "article",
      title: insight.title,
      description: insight.excerpt,
      publishedTime: insight.publishedAt,
      modifiedTime: insight.updatedAt,
      authors: [insight.author],
      tags: insight.tags,
      url: `https://tinlance.com/insights/${insight.slug}`,
    },
  };
}

export default async function InsightPage({
  params,
}: {
  params: InsightParams;
}) {
  const { slug } = await params;
  const insight = insights.find((item) => item.slug === slug);
  if (!insight) notFound();

  const author = getAuthor(insight.authorId);
  const related = insights.filter((item) => item.slug !== insight.slug && item.category === insight.category).slice(0, 2);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: insight.title,
    description: insight.excerpt,
    datePublished: insight.publishedAt,
    dateModified: insight.updatedAt,
    author: {
      "@type": "Organization",
      name: author?.name ?? insight.author,
      url: author?.url ?? "https://tinlance.com/about",
    },
    publisher: { "@id": "https://tinlance.com/#organization" },
    mainEntityOfPage: `https://tinlance.com/insights/${insight.slug}`,
    keywords: insight.tags.join(", "),
  };

  return (
    <main>
      <JsonLd
        data={[
          articleSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Insights", path: "/insights" },
            { name: insight.title, path: `/insights/${insight.slug}` },
          ]),
        ]}
      />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <Link href="/insights" className="text-link text-link-dark">
            <ArrowLeft size={16} /> All insights
          </Link>
          <p className="kicker kicker-dark" style={{ marginTop: "2rem" }}>{insight.category}</p>
          <h1 style={{ maxWidth: "980px", marginTop: "1rem" }}>{insight.title}</h1>
          <p style={{ maxWidth: "760px", fontSize: "1.2rem", marginTop: "1.5rem" }}>{insight.excerpt}</p>
          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
            {insight.author} · published {insight.publishedAt} · reviewed {insight.reviewedAt} · {insight.readingTime}
          </p>
        </div>
      </section>

      <article className="section-v2">
        <div className="container" style={{ maxWidth: "820px" }}>
          <div className="article-body">
            {insight.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: "4rem" }}>
              <p className="kicker">RELATED INSIGHTS</p>
              <div className="content-grid" style={{ marginTop: "1.5rem" }}>
                {related.map((item) => (
                  <Link className="content-card" href={`/insights/${item.slug}`} key={item.slug}>
                    <h3>{item.title}</h3>
                    <p style={{ marginTop: "0.75rem" }}>{item.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="assessment-card" style={{ marginTop: "4rem" }}>
            <div>
              <p className="kicker">APPLY THE IDEA</p>
              <h2>Have a system that needs this level of engineering?</h2>
              <p>Bring the workflow, constraints, and target outcome. We can assess the technical path with you.</p>
            </div>
            <Link className="button button-accent button-large" href="/assessment">
              Start a technical assessment <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
