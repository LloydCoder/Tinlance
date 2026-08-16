import Link from "next/link";
import { SectionHeading } from "../components/section-heading";

const services = [
  ["01", "AI Engineering", "Production AI systems, agent workflows, RAG, and integrations designed around measurable business outcomes."],
  ["02", "AI Security", "Threat modeling, agent security, application hardening, and security engineering for AI-enabled systems."],
  ["03", "Forward Deployed Engineering", "Embedded engineering teams that take ambiguous operational problems from discovery to production."],
];

const proof = [
  ["Architecture", "Next.js + TypeScript + cloud-native services"],
  ["Security", "Automated checks, typed boundaries, auditable workflows"],
  ["Delivery", "Git-based CI/CD with preview-first development"],
  ["AI", "Dedicated FDE engine boundary for agents and tools"],
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">AI engineering / security / FDE</span>
            <h1>We build the systems <span>AI makes possible.</span></h1>
            <p className="hero-copy">
              Tinlance helps ambitious organizations design, secure, and deploy production-grade AI systems — from the first technical decision to the workflows that run in production.
            </p>
            <div className="hero-actions">
              <Link className="button button-accent" href="/contact">Start a conversation</Link>
              <Link className="button button-dark" href="/work">See the work</Link>
            </div>
          </div>
          <aside className="hero-aside">
            <span className="eyebrow">Built to ship</span>
            <strong>Engineering, not demos.</strong>
            <p>We connect product intent, infrastructure, security, automation, and AI into systems teams can actually operate.</p>
          </aside>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <SectionHeading
            eyebrow="What we do"
            title="From ambiguous problem to production system."
            description="Tinlance combines forward-deployed engineering with AI infrastructure and security discipline so complex initiatives can move without sacrificing reliability."
          />
          <div className="card-grid">
            {services.map(([number, title, description]) => (
              <article className="card" key={number}>
                <span className="card-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container proof">
          <SectionHeading
            eyebrow="Engineering standard"
            title="The work should survive scrutiny."
            description="Tinlance is built in public where it helps demonstrate the engineering standard behind the services we sell."
          />
          <div className="proof-list">
            {proof.map(([label, value]) => (
              <div className="proof-item" key={label}>
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <span className="eyebrow">Start with the problem</span>
            <h2>Bring us the system that needs to work.</h2>
            <p>Tell us what is blocked, what is manual, or what needs to become intelligent. We will turn the ambiguity into an executable engineering plan.</p>
            <div className="hero-actions">
              <Link className="button button-accent" href="/contact">Book an assessment</Link>
              <Link className="button button-dark" href="/insights">Read our thinking</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
