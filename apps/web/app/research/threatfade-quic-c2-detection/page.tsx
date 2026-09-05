import Link from "next/link";

export const metadata = {
  title: "ThreatFade QUIC C2 Detection | Tinlance Research",
  description:
    "Tinlance research on detecting evasive C2 behavior in encrypted QUIC traffic with ThreatFade.",
};

export default function ThreatFadeResearchPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Research
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Detecting evasive C2 behavior in encrypted QUIC traffic
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        ThreatFade investigates whether changes in encrypted traffic behavior
        can provide useful signals for detecting deliberate operational
        silencing and evasive beaconing behavior.
      </p>

      <article className="prose prose-neutral mt-12 max-w-none">
        <h2>What ThreatFade measures</h2>
        <p>
          The current engine describes a rolling Shannon-entropy signal combined
          with multi-domain data fusion. The project is designed to operate
          offline and to support reproducible analysis rather than requiring a
          live cloud control plane.
        </p>

        <h2>Evidence boundary</h2>
        <p>
          ThreatFade&apos;s current public repository represents laboratory and
          research validation. This page intentionally makes no independent
          production-performance, false-positive, packet-count, or benchmark
          claim beyond the evidence published with the project.
        </p>

        <h2>Further work</h2>
        <p>
          Reproduction instructions, implementation details, tests, and
          validation evidence should be treated as the authoritative technical
          record as the research evolves.
        </p>
      </article>

      <div className="mt-12">
        <Link href="/threatfade" className="text-sm font-medium underline">
          Back to ThreatFade
        </Link>
      </div>
    </main>
  );
}
