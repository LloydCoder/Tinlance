import Link from "next/link";

export const metadata = {
  title: "Changelog | Tinlance",
  description: "Selected Tinlance product, platform, and engineering updates.",
  alternates: { canonical: "/changelog" },
};

const entries = [
  { date: "2026-09-06", title: "Commercial engine", body: "The Tinlance application now has a governed assessment-to-engagement commercial workflow with opportunities, proposals, versioning, acceptance, onboarding, and auditability." },
  { date: "2026-09-05", title: "ThreatFade research authority", body: "ThreatFade research received a dedicated canonical research route while the historical query-string article remains permanently mapped to it." },
];

export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Changelog</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">What has changed.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">Selected public changes to the Tinlance platform and engineering work. Research details live under Insights and Research.</p>
      </header>
      <div className="mt-12 space-y-8">
        {entries.map((entry) => (
          <article key={entry.date + entry.title} className="border-t border-neutral-200 pt-6">
            <p className="text-sm text-neutral-500">{entry.date}</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-950">{entry.title}</h2>
            <p className="mt-3 leading-7 text-neutral-600">{entry.body}</p>
          </article>
        ))}
      </div>
      <Link className="mt-10 inline-flex font-medium text-neutral-950 underline underline-offset-4" href="/insights">Read engineering insights</Link>
    </main>
  );
}
