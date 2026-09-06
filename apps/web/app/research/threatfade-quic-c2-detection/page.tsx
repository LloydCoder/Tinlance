import Link from "next/link";

export const metadata = {
  title: "ThreatFade QUIC C2 Detection | Tinlance Research",
  description:
    "Tinlance research on detecting evasive C2 behavior in encrypted QUIC traffic with ThreatFade.",
  alternates: { canonical: "/research/threatfade-quic-c2-detection" },
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
        <h2>Early MVP validation</h2>
        <p>
          The early ThreatFade MVP was reported and publicly documented against
          a test population of real Merlin QUIC C2 traffic. The reported result
          was 490,847 packets analyzed, a z-score of 14.76, and 0% false
          positives across the tested MVP populations.
        </p>
        <p>
          These figures describe that historical validation population. They do
          not establish universal detection accuracy, customer-scale
          performance, or a current production false-positive guarantee.
        </p>

        <h2>What ThreatFade measures</h2>
        <p>
          The current engine describes rolling Shannon-entropy signals,
          statistical deviation, heuristic detection, confidence scoring, and
          multi-domain correlation. The project is designed to support
          reproducible analysis and offline operation.
        </p>

        <h2>Evidence boundary</h2>
        <p>
          The current public repository is an evidence-first research and
          engineering project. Its README explicitly separates repository
          evidence from independent assurance such as third-party validation,
          certification, contractual SLAs, and customer-scale performance.
        </p>

        <h2>Further work</h2>
        <p>
          Reproduction instructions, implementation details, tests, and
          validation evidence remain the authoritative technical record as the
          research evolves.
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
