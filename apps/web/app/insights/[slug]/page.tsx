import { notFound } from "next/navigation";
import { insights } from "../../../lib/content";

export function generateStaticParams() {
  return insights.map((insight) => ({ slug: insight.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const insight = insights.find((item) => item.slug === params.slug);
  if (!insight) return {};
  return {
    title: `${insight.title} | Tinlance Insights`,
    description: insight.excerpt,
  };
}

export default function InsightPage({ params }: { params: { slug: string } }) {
  const insight = insights.find((item) => item.slug === params.slug);
  if (!insight) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">{insight.category}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">{insight.title}</h1>
      <p className="mt-6 text-lg leading-8 text-neutral-600">{insight.excerpt}</p>
      <p className="mt-4 text-sm text-neutral-500">Published {insight.publishedAt}</p>

      <article className="prose prose-neutral mt-12 max-w-none">
        <p>
          Tinlance publishes practical engineering intelligence for teams building and operating AI-enabled systems. This article is part of that research stream.
        </p>
        <p>
          For a deeper assessment of the architecture, security, or delivery requirements discussed here, connect with the Tinlance engineering team.
        </p>
        <a href="/contact" className="not-prose inline-flex rounded-full bg-neutral-950 px-5 py-3 font-medium text-white no-underline">
          Discuss your system
        </a>
      </article>
    </main>
  );
}
