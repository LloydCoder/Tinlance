export type Service = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
};

export type Insight = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
};

export const services: Service[] = [
  { slug: "ai-engineering", name: "AI Engineering", eyebrow: "Build", description: "Production AI systems, agent workflows, and reliable integrations designed around real business operations." },
  { slug: "ai-security", name: "AI Security", eyebrow: "Secure", description: "Security engineering for AI applications, agents, data flows, and the infrastructure around them." },
  { slug: "forward-deployed-engineering", name: "Forward-Deployed Engineering", eyebrow: "Deploy", description: "Hands-on engineering embedded with teams to turn complex technical requirements into working systems." },
  { slug: "enterprise-automation", name: "Enterprise Automation", eyebrow: "Automate", description: "Workflow automation that connects people, systems, data, and AI without adding operational drag." },
];

export const insights: Insight[] = [
  { slug: "building-production-ai-systems", title: "What changes when an AI system has to run in production", excerpt: "Reliability, observability, security, and human controls become product requirements—not afterthoughts.", category: "AI Engineering", publishedAt: "2026-08-16" },
  { slug: "securing-ai-agents", title: "A practical security model for AI agents", excerpt: "A clear way to think about identity, tool access, data boundaries, evaluation, and auditability.", category: "AI Security", publishedAt: "2026-08-16" },
  { slug: "what-fde-means", title: "Forward-deployed engineering, explained", excerpt: "Why some enterprise problems need engineers close to the customer rather than another generic software package.", category: "FDE", publishedAt: "2026-08-16" },
];
