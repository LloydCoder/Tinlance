import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { EvidenceStatusBadge } from "../../components/evidence-status";
import { evidenceRecords } from "../../lib/evidence/taxonomy";

export const metadata = {
  title: "ThreatFade | Tinlance",
  description: "ThreatFade is a Tinlance-developed open-core, offline-first platform for evidence-first detection and investigation of evasive behavior.",
  alternates: { canonical: "/threatfade" },
};

export default function ThreatFadePage() {
  const evidence = evidenceRecords.threatfadeQuicBaseline;
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Tinlance product</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">ThreatFade</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">A Tinlance-developed, open-core, offline-first cybersecurity detection platform focused on identifying deliberate operational silencing and evasive beaconing behavior in encrypted traffic.</p>
      <div className="mt-5"><EvidenceStatusBadge status={evidence.status} /></div>

      <section className="mt-12 rounded-2xl border p-6">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Scoped evidence</p>
        <h2 className="mt-3 text-2xl font-semibold">A documented result, not a universal guarantee.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">The early ThreatFade MVP was independently publicly documented as detecting real Merlin QUIC C2 traffic in a 490,847-packet test population, producing a z-score of 14.76. The documented baseline reports 0% false positives across the tested MVP populations. These are historical experimental results for that tested population, not a claim of universal current production accuracy.</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><dt className="font-semibold">Method</dt><dd className="text-muted-foreground">{evidence.methodology}</dd></div>
          <div><dt className="font-semibold">Scope</dt><dd className="text-muted-foreground">{evidence.scope}</dd></div>
          <div><dt className="font-semibold">Result</dt><dd className="text-muted-foreground">{evidence.result}</dd></div>
          <div><dt className="font-semibold">Limitation</dt><dd className="text-muted-foreground">{evidence.limitations}</dd></div>
        </dl>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/research/threatfade-quic-c2-detection" className="rounded-md border px-5 py-3 text-sm font-medium">Read the research</Link>
        <a href="https://github.com/LloydCoder/tinlance-threatfade" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm font-medium" aria-label="ThreatFade GitHub repository">GitHub repository <ExternalLink size={16} /></a>
        <a href="https://threatfade.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background">Visit ThreatFade <ExternalLink size={16} /></a>
        <Link href="/products" className="rounded-md border px-5 py-3 text-sm font-medium">Tinlance products</Link>
      </div>
    </main>
  );
}
