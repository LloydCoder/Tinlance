import Link from "next/link";
import { insights } from "../../lib/content";

export const metadata = {
  title: "Insights | Tinlance",
  description: "Engineering, AI security, FDE, and enterprise automation insights from Tinlance.",
};

export default function InsightsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Tinlance Insights</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-950">Engineering intelligence for teams building with AI.</h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600">Practical thinking on AI engineering, security, forward-deployed engineering, and enterprise automation.</p>
      </header>
      <section className="mt-14 grid gap-6 md:grid-cols-3" aria-label="Latest insights">
        {insights.map((insight) => (
          <article key={insight.slug} className="rounded-2xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">{insight.category}</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-950">{insight.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{insight.excerpt}</p>
            <Link className="mt-6 inline-flex font-medium text-neutral-950 underline underline-offset-4" href={`/insights/${insight.slug}`}>
              Read insight
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
