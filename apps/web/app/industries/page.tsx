import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Industries | Tinlance",
  description:
    "AI engineering and forward-deployed delivery for organizations with complex workflows, data, and security requirements.",
};

const industries = [
  [
    "Financial Services",
    "Automate high-volume operations while protecting sensitive financial data and enforcing strong controls.",
  ],
  [
    "Healthcare",
    "Build secure workflow automation and AI capabilities around operational and administrative complexity.",
  ],
  [
    "SaaS & Technology",
    "Turn AI capabilities into reliable product and internal engineering systems.",
  ],
  [
    "Cybersecurity",
    "Operationalize intelligence, detection, automation, and secure AI workflows.",
  ],
  [
    "Professional Services",
    "Transform repeatable knowledge work into measurable, governed AI-assisted workflows.",
  ],
  [
    "Enterprise Operations",
    "Connect fragmented systems and teams through automation designed around the real process.",
  ],
];

export default function IndustriesPage() {
  return (
    <main>
      <section className="section-v2 dark-section">
        <div
          className="container"
          style={{ paddingTop: "7rem", paddingBottom: "6rem" }}
        >
          <p className="kicker kicker-dark">TINLANCE / INDUSTRIES</p>
          <h1 style={{ maxWidth: "900px" }}>
            AI systems built around the reality of your industry.
          </h1>
          <p
            style={{
              maxWidth: "720px",
              fontSize: "1.2rem",
              marginTop: "1.5rem",
            }}
          >
            The technology changes. The engineering discipline does not:
            understand the workflow, respect the constraints, ship the system,
            measure the result.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="capability-grid">
            {industries.map(([name, text], index) => (
              <article className="capability-card" key={name}>
                <span className="capability-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="capability-card-body">
                  <h2>{name}</h2>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2 assessment-section">
        <div className="container assessment-card">
          <div>
            <p className="kicker">NOT SURE WHERE TO START?</p>
            <h2>Start with the workflow.</h2>
            <p>
              We will identify where AI, automation, or security engineering can
              create the highest-value change.
            </p>
          </div>
          <Link className="button button-accent button-large" href="/contact">
            Book an assessment <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
