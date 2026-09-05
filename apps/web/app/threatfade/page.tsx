import Link from "next/link";

export const metadata = {
  title: "ThreatFade | Tinlance",
  description:
    "ThreatFade is Tinlance's open-core, offline-first research platform for detecting evasive C2 behavior in encrypted traffic.",
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
