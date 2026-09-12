import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";

export const metadata: Metadata = {
  title: "About Tinlance",
  description: "Tinlance is a technical AI and Forward-Deployed Engineering company building production-oriented systems with security, evaluation, and operational ownership in the engineering loop.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Tinlance",
    description: "The engineering philosophy and product ecosystem behind Tinlance.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Tinlance",
    description: "Technical AI/FDE engineering built around real workflows, security, evaluation and evidence.",
  },
};

const principles = [
  ["Evidence before claims", "We prefer executable systems, tests, public repositories and documented evidence over capability statements that cannot be inspected."],
  ["Security by architecture", "Identity, tenant boundaries, authorization, policy, risk and auditability belong in the system path—not as a late checklist."],
  ["Human control for consequential actions", "High-impact operations should retain authorized human review and explicit policy boundaries."],
  ["Evaluation before autonomy", "AI behavior needs evaluation and regression controls before increasing the scope of automated execution."],
  ["Production constraints matter", "The useful system is the one that survives real data, integrations, security requirements, reliability constraints and operational ownership."],
  ["Reusable systems from real delivery", "Repeated engineering problems can become playbooks, workflows and products when the evidence supports productization."],
];

export default function AboutPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">ABOUT TINLANCE</p>
          <h1 style={{ maxWidth: "980px" }}>A technical AI/FDE company built around the operating environment.</h1>
          <p style={{ maxWidth: "780px", fontSize: "1.2rem", marginTop: "1.5rem" }}>
            Tinlance builds production-oriented AI systems across engineering, security, automation and Forward-Deployed Engineering. The focus is not simply adding AI to software; it is engineering the workflow, controls and delivery path around how the business actually operates.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2">
            <div><p className="kicker">01 / WHY FDE</p><h2>From AI integration to <span>operational engineering.</span></h2></div>
            <p>Forward-Deployed Engineering brings senior engineering judgment into the environment where the problem exists: workflows, data, systems, constraints, security and measurable outcomes.</p>
          </div>
          <div className="proof-feature">
            <div className="proof-feature-main">
              <p className="kicker">THE SHIFT</p>
              <h3>Domain-specific engineering. Secure tool use. Evaluation. Operational ownership.</h3>
              <p>That means designing the boundary around an AI capability as carefully as the model or application itself, then testing the system against the conditions that matter in production.</p>
            </div>
            <div className="proof-metrics">
              <div><strong>AI</strong><span>Engineering</span></div>
              <div><strong>FDE</strong><span>Delivery model</span></div>
              <div><strong>SEC</strong><span>Control discipline</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <p className="kicker">02 / ENGINEERING PHILOSOPHY</p>
          <div className="capability-grid">
            {principles.map(([title, text]) => (
              <article className="capability-card" key={title}>
                <span className="capability-index">PRINCIPLE</span>
                <div className="capability-card-body"><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2 compact">
            <div><p className="kicker">03 / ECOSYSTEM</p><h2>One engineering practice. <span>Clear product boundaries.</span></h2></div>
            <p>Tinlance is the public commercial and customer-facing platform. Its product ecosystem includes distinct systems with their own boundaries and evidence states.</p>
          </div>
          <div className="capability-grid">
            <article className="capability-card"><span className="capability-index">TINLANCE</span><div className="capability-card-body"><h3>Commercial + customer platform</h3><p>Assessment, qualification, delivery, APIs, security and platform control layers.</p></div></article>
            <article className="capability-card"><span className="capability-index">FDE MASTERY</span><div className="capability-card-body"><h3>FDE execution layer</h3><p>Eight domain contracts and a reusable engineering platform for governed AI workflows.</p></div></article>
            <article className="capability-card"><span className="capability-index">THREATFADE</span><div className="capability-card-body"><h3>Independent security product</h3><p>Evidence-first detection and investigation platform with its own product identity and public repository.</p></div></article>
            <article className="capability-card"><span className="capability-index">AGENT PLATFORM</span><div className="capability-card-body"><h3>Private control substrate</h3><p>A proprietary foundation for governed agent execution; its current M0 foundation is intentionally private and in progress.</p></div></article>
          </div>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <div className="assessment-card">
            <div><p className="kicker">PUBLIC FOUNDATION</p><h2>See the <span>security model</span> and engineering evidence.</h2><p>Explore how Tinlance approaches security controls, platform architecture and public technical evidence before moving into a technical assessment.</p></div>
            <div className="assessment-action">
              <Link className="button button-accent button-large" href="/assessment">Technical assessment <ArrowUpRight size={18} /></Link>
              <Link className="text-link" href="/products">Explore products <ArrowUpRight size={16} /></Link>
              <Link className="text-link" href="/engineering">View engineering <ArrowUpRight size={16} /></Link>
              <Link className="text-link" href="/security">View security <ArrowUpRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
