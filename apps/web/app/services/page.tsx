import Link from "next/link";
import { SectionHeading } from "../../components/section-heading";

const services = [
  ["Autonomous AI", "/services/autonomous-ai", "AI workflows that connect models, tools, rules, human review, and observability."],
  ["AI Infrastructure", "/services/ai-infrastructure", "Production foundations for model gateways, RAG, evaluation, deployment, and telemetry."],
  ["AI Security", "/services/ai-security", "Threat modeling and security engineering for AI-enabled applications and agents."],
  ["Forward Deployed Engineering", "/services/fde", "Embedded engineering for complex operational problems that need to reach production."],
];

export default function ServicesPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow="Services" title="Engineering capacity for difficult systems." description="AI engineering, AI security, automation, and forward-deployed engineering delivered around your operational reality." />
        <div className="card-grid">
          {services.map(([title, href, description]) => (
            <Link className="card" href={href} key={href}>
              <span className="card-number">SERVICE</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
