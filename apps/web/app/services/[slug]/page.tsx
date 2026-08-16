import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

const services = {
  "ai-engineering": {
    title: "AI Engineering",
    eyebrow: "AI ENGINEERING",
    summary:
      "Production AI systems engineered around your data, workflows, constraints, and measurable business outcomes.",
    description:
      "Tinlance helps teams move from promising AI experiments to reliable production capabilities. We design the system around retrieval, evaluation, tool use, observability, security, and the operating workflow—not just the model.",
    outcomes: [
      "Production AI agents and workflows",
      "RAG and knowledge systems",
      "Evaluation and reliability frameworks",
      "Model-agnostic architecture and integration",
    ],
  },
  "forward-deployed-engineering": {
    title: "Forward Deployed Engineering",
    eyebrow: "FDE",
    summary:
      "Senior engineering embedded with your team to turn ambiguous operational problems into shipped systems.",
    description:
      "Forward deployment means working close to the people, systems, data, and constraints where the problem actually exists. Tinlance owns the path from discovery through implementation, deployment, and iteration.",
    outcomes: [
      "Embedded technical discovery",
      "Architecture and implementation",
      "Production deployment and integration",
      "Adoption, reliability, and continuous improvement",
    ],
  },
  "ai-security": {
    title: "AI Security",
    eyebrow: "SECURITY ENGINEERING",
    summary:
      "Secure AI applications, agents, infrastructure, and data flows before adversaries find the gaps.",
    description:
      "We apply threat modeling, secure architecture, application security, agent security, supply-chain controls, and operational safeguards to AI systems that have to withstand real-world risk.",
    outcomes: [
      "AI and agent threat modeling",
      "Application and API hardening",
      "Secure AI infrastructure",
      "Security controls and production readiness",
    ],
  },
  "enterprise-automation": {
    title: "Enterprise Automation",
    eyebrow: "AUTOMATION",
    summary:
      "Connect people, systems, data, and AI into workflows that remove operational drag without creating fragile automation.",
    description:
      "Tinlance maps the real workflow first, then combines APIs, AI agents, orchestration, human approvals, and observability to automate the work safely. The goal is measurable cycle-time, cost, and reliability improvement.",
    outcomes: [
      "Workflow discovery and automation design",
      "AI-assisted operations and orchestration",
      "System and API integration",
      "Monitoring, controls, and measurable outcomes",
    ],
  },
} as const;

type ServiceSlug = keyof typeof services;

export function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services[slug as ServiceSlug];

  if (!service) return { title: "Services | Tinlance" };

  return {
    title: `${service.title} | Tinlance`,
    description: service.summary,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services[slug as ServiceSlug];

  if (!service) {
    return (
      <main className="container section-v2">
        <p className="kicker">404 / SERVICE</p>
        <h1>That capability does not exist.</h1>
        <Link className="text-link" href="/">
          Return home <ArrowUpRight size={16} />
        </Link>
      </main>
    );
  }

  return (
    <main>
      <section className="section-v2 dark-section">
        <div
          className="container"
          style={{ paddingTop: "7rem", paddingBottom: "7rem" }}
        >
          <p className="kicker kicker-dark">{service.eyebrow}</p>
          <h1 style={{ maxWidth: "900px" }}>{service.title}</h1>
          <p
            style={{
              maxWidth: "760px",
              fontSize: "1.25rem",
              marginTop: "1.5rem",
            }}
          >
            {service.summary}
          </p>
          <div style={{ marginTop: "2rem" }}>
            <Link className="button button-accent button-large" href="/contact">
              Discuss a project <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "4rem",
          }}
        >
          <div>
            <p className="kicker">THE APPROACH</p>
            <h2>Built for the operating environment.</h2>
          </div>
          <p style={{ fontSize: "1.1rem", lineHeight: 1.8 }}>
            {service.description}
          </p>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <p className="kicker">WHAT WE DELIVER</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            {service.outcomes.map((outcome) => (
              <div className="capability-card" key={outcome}>
                <CheckCircle2 size={20} />
                <h3>{outcome}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2 assessment-section">
        <div className="container assessment-card">
          <div>
            <p className="kicker">NEXT STEP</p>
            <h2>Start with the problem, not the technology.</h2>
            <p>
              Bring the workflow, constraint, or system you need to change. We
              will help define the engineering path.
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
