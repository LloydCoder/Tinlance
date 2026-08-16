import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, CircleDot, ShieldCheck, Sparkles } from "lucide-react";

const capabilities = [
  {
    index: "01",
    title: "AI Engineering",
    text: "Production agents, RAG systems, workflow automation, and AI products engineered around real operating constraints.",
    href: "/services/ai-engineering",
  },
  {
    index: "02",
    title: "Forward Deployed Engineering",
    text: "Senior engineering embedded with your team to turn ambiguous business problems into shipped, measurable systems.",
    href: "/services/forward-deployed-engineering",
  },
  {
    index: "03",
    title: "AI Security",
    text: "Threat modeling, agent security, application hardening, and secure AI infrastructure from architecture to production.",
    href: "/services/ai-security",
  },
];

const proof = [
  ["01", "Discover", "Understand the workflow, constraints, data, risk, and business outcome."],
  ["02", "Design", "Turn the problem into an executable architecture and delivery plan."],
  ["03", "Deploy", "Build inside the real environment, integrate the systems, and ship."],
  ["04", "Improve", "Measure adoption, reliability, security, and business impact continuously."],
];

const signals = [
  "Production-first engineering",
  "Security built into the delivery loop",
  "Model and infrastructure agnostic",
  "Evidence-driven technical decisions",
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-v2">
        <div className="hero-grid-v2 container">
          <div className="hero-copy-v2">
            <div className="status-pill"><CircleDot size={12} /> Available for select engineering engagements</div>
            <p className="kicker">TINLANCE / AI ENGINEERING / FDE</p>
            <h1>Make AI <em>work</em> inside the business.</h1>
            <p className="hero-lede">
              We design, build, secure, and deploy production AI systems around the way your organization actually operates — not the way a demo looks.
            </p>
            <div className="hero-actions">
              <Link className="button button-accent button-large" href="/contact">Start an assessment <ArrowUpRight size={17} /></Link>
              <Link className="text-link" href="/work">Explore our work <ChevronRight size={16} /></Link>
            </div>
            <div className="hero-signals">
              {signals.map((signal) => <span key={signal}><Check size={14} /> {signal}</span>)}
            </div>
          </div>
          <div className="system-visual" aria-label="Tinlance engineering system visualization">
            <div className="visual-label">FDE / SYSTEM MAP</div>
            <div className="visual-core"><Sparkles size={26} /><span>Business<br />Outcome</span></div>
            <div className="orbit orbit-one"><span>Data</span></div>
            <div className="orbit orbit-two"><span>Agents</span></div>
            <div className="orbit orbit-three"><span>Tools</span></div>
            <div className="visual-node node-a">RAG</div>
            <div className="visual-node node-b">Evals</div>
            <div className="visual-node node-c">Security</div>
            <div className="visual-node node-d">Workflow</div>
            <div className="visual-footer"><span>01</span><span>Context → Intelligence → Action</span><span>LIVE</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-inner">
          <span>ENGINEERING FOR TEAMS THAT NEED TO SHIP</span>
          <div><b>AI</b><b>SECURITY</b><b>INFRASTRUCTURE</b><b>AUTOMATION</b></div>
        </div>
      </section>

      <section className="section-v2 capability-section">
        <div className="container">
          <div className="section-intro-v2">
            <div><p className="kicker">01 / CAPABILITIES</p><h2>Where strategy ends,<br /><span>engineering begins.</span></h2></div>
            <p>One senior engineering partner across the layers that determine whether an AI initiative becomes a useful production capability.</p>
          </div>
          <div className="capability-grid">
            {capabilities.map((item) => (
              <Link href={item.href} className="capability-card" key={item.index}>
                <span className="capability-index">{item.index}</span>
                <div className="capability-card-body"><h3>{item.title}</h3><p>{item.text}</p></div>
                <ArrowUpRight className="capability-arrow" size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2 dark-section">
        <div className="container process-layout">
          <div className="process-sticky"><p className="kicker kicker-dark">02 / HOW WE WORK</p><h2>Embedded.<br /><span>Accountable.</span><br />Shipped.</h2><p>FDE means getting close enough to the real problem to own the engineering outcome. We work in your environment, with your people, against your constraints.</p><Link className="button button-outline" href="/services/forward-deployed-engineering">See the FDE model <ArrowUpRight size={16} /></Link></div>
          <div className="process-list">
            {proof.map(([index, title, text]) => (
              <div className="process-row" key={index}><span>{index}</span><div><h3>{title}</h3><p>{text}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-v2 proof-section">
        <div className="container">
          <div className="section-intro-v2 compact"><div><p className="kicker">03 / PROOF</p><h2>Built by engineers.<br /><span>Proven in public.</span></h2></div><p>Our own systems are part of the proof. Explore the security products, open-source work, and production platforms behind the Tinlance engineering practice.</p></div>
          <div className="proof-feature">
            <div className="proof-feature-main"><div className="proof-icon"><ShieldCheck size={24} /></div><p className="kicker">THREATFADE / SECURITY ENGINEERING</p><h3>Engineering security systems that can operate at the edge of real-world risk.</h3><p>Threat intelligence, security automation, and practical engineering built around adversarial environments.</p><Link className="text-link" href="/work">View the work <ArrowUpRight size={16} /></Link></div>
            <div className="proof-metrics"><div><strong>01</strong><span>Open-source security contributions</span></div><div><strong>24/7</strong><span>Production-minded observability</span></div><div><strong>∞</strong><span>Continuous improvement loop</span></div></div>
          </div>
        </div>
      </section>

      <section className="section-v2 assessment-section">
        <div className="container assessment-card">
          <div><p className="kicker">04 / START HERE</p><h2>Bring us the problem.<br /><span>We&apos;ll bring the system.</span></h2><p>Tell us what is manual, blocked, expensive, risky, or ready for AI. We&apos;ll turn the ambiguity into an executable engineering path.</p></div>
          <div className="assessment-action"><Link className="button button-accent button-large" href="/contact">Book a technical assessment <ArrowUpRight size={18} /></Link><span>Initial conversation · No slide deck required</span></div>
        </div>
      </section>
    </div>
  );
}
