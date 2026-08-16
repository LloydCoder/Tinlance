export type Service = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
};

export type ProofItem = {
  slug: string;
  name: string;
  category: string;
  description: string;
  outcome: string;
  href?: string;
};

export type Insight = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  author: string;
  readingTime: string;
  tags: string[];
  body: string[];
};

export const services: Service[] = [
  {
    slug: "ai-engineering",
    name: "AI Engineering",
    eyebrow: "Build",
    description:
      "Production AI systems, agent workflows, and reliable integrations designed around real business operations.",
  },
  {
    slug: "ai-security",
    name: "AI Security",
    eyebrow: "Secure",
    description:
      "Security engineering for AI applications, agents, data flows, and the infrastructure around them.",
  },
  {
    slug: "forward-deployed-engineering",
    name: "Forward-Deployed Engineering",
    eyebrow: "Deploy",
    description:
      "Hands-on engineering embedded with teams to turn complex technical requirements into working systems.",
  },
  {
    slug: "enterprise-automation",
    name: "Enterprise Automation",
    eyebrow: "Automate",
    description:
      "Workflow automation that connects people, systems, data, and AI without adding operational drag.",
  },
];

export const proof: ProofItem[] = [
  {
    slug: "threatfade",
    name: "ThreatFade",
    category: "Security engineering",
    description:
      "A network threat intelligence and defensive security engineering project built to turn security signals into practical decisions.",
    outcome:
      "Demonstrates applied security engineering, detection thinking, and production-oriented defensive tooling.",
  },
  {
    slug: "fde-mastery",
    name: "FDE Mastery",
    category: "AI / FDE platform",
    description:
      "A production-oriented execution layer for agent routing, domain adapters, evaluation, resilience, and telemetry.",
    outcome:
      "Demonstrates the engineering patterns required to move agent systems beyond prototypes and into governed operations.",
  },
  {
    slug: "open-source-security",
    name: "Open-source security work",
    category: "Public engineering",
    description:
      "Security contributions and developer tooling designed to solve concrete problems in the wider engineering ecosystem.",
    outcome:
      "Creates independently inspectable evidence of engineering quality, security discipline, and technical problem solving.",
  },
];

export const insights: Insight[] = [
  {
    slug: "building-production-ai-systems",
    title: "What changes when an AI system has to run in production",
    excerpt:
      "Reliability, observability, security, evaluation, and human controls become product requirements—not afterthoughts.",
    category: "AI Engineering",
    publishedAt: "2026-08-16",
    author: "Tinlance Engineering",
    readingTime: "6 min read",
    tags: ["AI engineering", "production", "reliability"],
    body: [
      "A prototype can succeed with a prompt, a model, and a happy-path demo. A production AI system has a different contract: it must behave predictably when inputs are incomplete, dependencies fail, users disagree with the model, and business rules change.",
      "That changes the engineering surface. Identity, tool permissions, data boundaries, evaluation datasets, observability, retries, fallbacks, and human escalation become first-class parts of the product rather than infrastructure tickets for later.",
      "The practical lesson is to design the operational boundary at the same time as the model workflow. When an agent can take an action, the system should be able to explain who authorized it, what context it received, what tools it used, and what happened afterward.",
    ],
  },
  {
    slug: "securing-ai-agents",
    title: "A practical security model for AI agents",
    excerpt:
      "Identity, tool access, data boundaries, evaluation, and auditability form the minimum control plane for capable agents.",
    category: "AI Security",
    publishedAt: "2026-08-16",
    author: "Tinlance Engineering",
    readingTime: "7 min read",
    tags: ["AI security", "agents", "OWASP"],
    body: [
      "An AI agent should be treated as an application component with privileged capabilities, not as an untrusted chatbot with a nicer interface. The security model therefore starts with identity and authorization.",
      "Tool calls should be explicit, scoped, logged, and subject to policy. Sensitive data should cross clear trust boundaries. Prompts and retrieved documents should be treated as inputs that can contain hostile instructions. High-impact actions should have deterministic validation and, where appropriate, human approval.",
      "The strongest architecture makes unsafe behavior difficult by construction: short-lived credentials, least privilege, typed tool contracts, bounded retrieval, policy checks, audit trails, and evaluation against adversarial cases.",
    ],
  },
  {
    slug: "what-fde-means",
    title: "Forward-deployed engineering, explained",
    excerpt:
      "Why complex enterprise problems often need engineers close to the customer rather than another generic software package.",
    category: "FDE",
    publishedAt: "2026-08-16",
    author: "Tinlance Engineering",
    readingTime: "5 min read",
    tags: ["FDE", "enterprise", "delivery"],
    body: [
      "Forward-deployed engineering closes the distance between a product team and the messy reality of a customer's environment. The engineer works directly with the workflow, constraints, data, integrations, and stakeholders that determine whether a system actually succeeds.",
      "The output is not simply a consulting report. It is a working system, integration, automation, or technical path that can be operated and improved after the engagement.",
      "For AI, this model is especially useful because the hard part is rarely choosing a model. It is connecting the model to reliable data, tools, permissions, evaluation, observability, and business processes.",
    ],
  },
];
