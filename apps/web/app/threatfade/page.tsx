import Link from "next/link";

export const metadata = {
  title: "ThreatFade | Tinlance",
  description:
    "ThreatFade is Tinlance's open-core, offline-first research platform for detecting evasive C2 behavior in encrypted traffic.",
  alternates: { canonical: "/threatfade" },
};

export default function ThreatFadePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Tinlance research
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
        ThreatFade
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
        An open-core, offline-first cybersecurity detection platform focused on
        identifying deliberate operational silencing and evasive beaconing
        behavior in encrypted traffic.
      </p>

      <section className="mt-12 rounded-2xl border p-6">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Early MVP validation
        </p>
        <h2 className="mt-3 text-2xl font-semibold">A scoped result, not a universal guarantee.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          The early ThreatFade MVP was reported and independently publicly documented as detecting real Merlin QUIC C2 traffic in a 490,847-packet test population, producing a z-score of 14.76 and 0% false positives across the tested MVP populations. These are historical experimental results for that tested population, not a claim of universal current production accuracy.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/research/threatfade-quic-c2-detection"
          className="rounded-md border px-5 py-3 text-sm font-medium"
        >
          Read the research
        </Link>
        <Link
          href="/work"
          className="rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background"
        >
          View the work
        </Link>
      </div>
    </main>
  );
}
