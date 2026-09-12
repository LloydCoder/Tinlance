import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";

export const metadata: Metadata = {
  title: "Security Engineering",
  description: "How Tinlance engineers identity, authorization, policy, risk, evaluation, auditability, and secure AI execution into its platform.",
  alternates: { canonical: "/security" },
  openGraph: {
    title: "Security Engineering | Tinlance",
    description: "The engineering controls behind Tinlance AI and FDE systems.",
    url: "/security",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Security Engineering | Tinlance",
    description: "Identity, policy, risk, evaluation, and auditability for governed AI execution.",
  },
};

const controls = [
  ["Identity & access", "Better Auth provides the application identity boundary. Organization membership, roles and permissions are enforced server-side rather than by UI state."],
  ["Tenant isolation", "Customer-owned resources are scoped to an organization boundary. The platform uses tenant-aware authorization and PostgreSQL persistence as a backstop."],
  ["Policy & risk", "M7 provides a deterministic authorization and risk boundary around sensitive AI actions, with fail-closed behavior and explicit approval or step-up requirements."],
  ["Agent execution", "M9 keeps identity-bound agent execution bounded. Agent capabilities, memory, cancellation, approvals and runtime evidence remain controlled rather than implicit model authority."],
  ["MCP & tools", "M6 is the MCP/tool boundary. Tool use is mediated by authorization and policy rather than exposing unrestricted model-to-system access."],
  ["Evaluation", "M8 provides evaluation and regression controls for AI behavior. Evaluation is an assurance mechanism, not a claim that an AI system is universally safe or accurate."],
];

const evidence = [
  ["Implemented", "Core identity, tenant authorization, M6/M7/M8/M9 boundaries and audit-oriented controls are represented in the current repository."],
  ["Tested", "The repository uses automated unit/integration/security regression gates and dedicated M6–M9 workflows."],
  ["Baseline", "Tinlance uses OWASP ASVS 5.0 as an engineering verification baseline, with additional controls for AI and agent execution."],
  ["Not claimed", "No page or repository state is treated as proof of certification, regulatory approval, customer deployment, or perfect security."],
];

export default function SecurityPage() {
  return (
    <main>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Security", path: "/security" }])} />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">TINLANCE / SECURITY ENGINEERING</p>
          <h1 style={{ maxWidth: "980px" }}>Security is a control path, not a checklist.</h1>
          <p style={{ maxWidth: "760px", fontSize: "1.2rem", marginTop: "1.5rem" }}>
            Tinlance treats identity, tenant context, authorization, policy, risk, approval, execution, output controls and audit evidence as part of the AI engineering path.
          </p>
          <div className="hero-signals" style={{ marginTop: "2rem", borderColor: "#29302c" }}>
            <span><LockKeyhole size={14} /> Server-side authorization</span>
            <span><ShieldCheck size={14} /> Fail-closed security boundaries</span>
            <span><CheckCircle2 size={14} /> Evidence-aware verification</span>
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2">
            <div><p className="kicker">01 / SECURITY ARCHITECTURE</p><h2>Identity → policy → <span>controlled action.</span></h2></div>
            <p>Model output, memory, tool output and external inputs are treated as untrusted. Authorization remains a server-side decision.</p>
          </div>
          <div className="proof-feature">
            <div className="proof-feature-main">
              <p className="kicker">CONTROL PATH</p>
              <h3>Identity → Tenant → Principal → Permission → Policy → Risk → Approval → Execution → Output → Audit</h3>
              <p>This is the control sequence documented for the M7 security gateway. M9 executes within it; M6 remains the MCP/tool boundary; M8 remains the evaluation authority.</p>
            </div>
            <div className="proof-metrics">
              <div><strong>M7</strong><span>Security control plane</span></div>
              <div><strong>M6</strong><span>MCP / tool boundary</span></div>
              <div><strong>M8</strong><span>Evaluation authority</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <p className="kicker">02 / ENGINEERING CONTROLS</p>
          <div className="capability-grid">
            {controls.map(([title, text]) => (
              <article className="capability-card" key={title}>
                <span className="capability-index">CONTROL</span>
                <div className="capability-card-body"><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2 compact">
            <div><p className="kicker">03 / SUPPLY CHAIN & VERIFICATION</p><h2>Evidence has a <span>status.</span></h2></div>
            <p>Security language should distinguish implementation, testing, external validation and assurance. Tinlance does not collapse those states into a single marketing claim.</p>
          </div>
          <div className="capability-grid">
            {evidence.map(([title, text]) => (
              <article className="capability-card" key={title}>
                <span className="capability-index">{title.toUpperCase()}</span>
                <div className="capability-card-body"><p>{text}</p></div>
              </article>
            ))}
          </div>
          <div className="assessment-card" style={{ marginTop: "4rem" }}>
            <div><p className="kicker">TECHNICAL ASSESSMENT</p><h2>Bring your AI system into the <span>control path.</span></h2><p>Use a technical assessment to examine architecture, data boundaries, tool access, security controls and delivery constraints in your environment.</p></div>
            <Link className="button button-accent button-large" href="/assessment">Start an assessment <ArrowUpRight size={18} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
