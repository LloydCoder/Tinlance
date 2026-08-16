import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Work & Engineering Proof | Tinlance",
  description:
    "Explore Tinlance engineering products, security work, open-source contributions, and production systems.",
};

const proof = [
  [
    "ThreatFade",
    "Security engineering",
    "A network threat intelligence and security engineering project demonstrating practical defensive systems work.",
  ],
  [
    "FDE Mastery",
    "AI engineering",
    "A production-oriented execution layer for agent routing, domain adapters, evaluation, resilience, and telemetry.",
  ],
  [
    "Open-source security",
    "Public engineering",
    "Security contributions and tooling built to solve concrete problems in the wider engineering ecosystem.",
  ],
];

export default function WorkPage() {
  return (
    <main>
      <section className="section-v2 dark-section">
        <div
          className="container"
          style={{ paddingTop: "7rem", paddingBottom: "6rem" }}
        >
          <p className="kicker kicker-dark">TINLANCE / PROOF</p>
          <h1 style={{ maxWidth: "900px" }}>
            We build the systems we say we can build.
          </h1>
          <p
            style={{
              maxWidth: "720px",
              fontSize: "1.2rem",
              marginTop: "1.5rem",
            }}
          >
            Our own products and public engineering work are part of the
            evidence behind the Tinlance practice.
          </p>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <div className="proof-feature">
            <div className="proof-feature-main">
              <div className="proof-icon">
                <ShieldCheck size={24} />
              </div>
              <p className="kicker">ENGINEERING EVIDENCE</p>
              <h2>Production thinking, made visible.</h2>
              <p>
                We prefer demonstrable systems, public technical work, and
                measurable engineering decisions over capability claims without
                evidence.
              </p>
            </div>
            <div className="proof-metrics">
              <div>
                <strong>01</strong>
                <span>Security products</span>
              </div>
              <div>
                <strong>02</strong>
                <span>AI/FDE platforms</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>Continuous engineering</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="capability-grid">
            {proof.map(([name, category, text]) => (
              <article className="capability-card" key={name}>
                <p className="kicker">{category}</p>
                <h2>{name}</h2>
                <p>{text}</p>
                <Link className="text-link" href="/contact">
                  Discuss related work <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
