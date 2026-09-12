import type { EvidenceRecord, EvidenceStatus, EvidenceType } from "./taxonomy";

export type ArchitectureModule = {
  id: string;
  name: string;
  purpose: string;
  status: EvidenceStatus;
  boundary: string;
  href?: string;
  repository?: string;
};

export const architectureModules: ArchitectureModule[] = [
  { id: "M1", name: "Commercial Engine", purpose: "Assessment, lead, qualification, booking, proposal and engagement flow.", status: "IMPLEMENTED", boundary: "Public/commercial application" },
  { id: "M3", name: "Customer Workspace", purpose: "Tenant-scoped customer delivery and evidence surfaces.", status: "IMPLEMENTED", boundary: "Authenticated customer application" },
  { id: "M4", name: "Automation", purpose: "Workflow execution and orchestration boundary.", status: "IMPLEMENTED", boundary: "Application workflow layer" },
  { id: "M5", name: "API Platform", purpose: "Central API surface for platform capabilities and contracts.", status: "IMPLEMENTED", boundary: "API/application boundary" },
  { id: "M6", name: "MCP Gateway", purpose: "Controlled MCP/tool boundary with authorization-aware execution.", status: "TESTED", boundary: "Protocol/tool trust boundary" },
  { id: "M7", name: "AI Security Gateway", purpose: "Identity, tenancy, authorization, policy, risk, approval, output and audit controls.", status: "TESTED", boundary: "Security/trust plane" },
  { id: "M8", name: "Evaluation Platform", purpose: "Evaluation and regression authority for AI behavior and release decisions.", status: "TESTED", boundary: "Evaluation/control plane" },
  { id: "M9", name: "Agent Runtime", purpose: "Bounded agent execution with identity, approvals and runtime evidence.", status: "TESTED", boundary: "Execution boundary" },
  { id: "M10", name: "Knowledge / RAG", purpose: "Knowledge and retrieval authority with explicit scope boundaries.", status: "TESTED", boundary: "Knowledge/data boundary" },
  { id: "M11", name: "AI Sales Engineer", purpose: "Grounded technical discovery and product information surface.", status: "IMPLEMENTED", boundary: "Public product/discovery application" },
  { id: "M12", name: "Revenue Intelligence", purpose: "Commercial and revenue intelligence layer.", status: "IMPLEMENTED", boundary: "Internal commercial data layer" },
  { id: "M13", name: "Proprietary Knowledge Moat", purpose: "Governed intelligence derived from approved delivery evidence.", status: "IMPLEMENTED", boundary: "Private knowledge layer" },
  { id: "M14", name: "Consulting → Software", purpose: "Pattern-to-playbook-to-productization feedback loop.", status: "IMPLEMENTED", boundary: "Productization strategy/control layer" },
];

export const architectureFlows = [
  ["M1", "M3", "Commercial context becomes tenant-scoped delivery context."],
  ["M3", "M5", "Customer delivery uses the API boundary."],
  ["M5", "M7", "Sensitive AI capabilities cross the security control plane."],
  ["M7", "M8", "Protected execution is evaluated before release/promotion."],
  ["M8", "M9", "Evaluation gates agent runtime behavior."],
  ["M9", "M10", "Agent execution consumes scoped knowledge/retrieval."],
  ["M10", "M11", "Grounded knowledge supports technical discovery."],
  ["M11", "M12", "Commercial discovery can feed governed revenue intelligence."],
  ["M12", "M13", "Approved delivery/commercial evidence informs the private knowledge layer."],
  ["M13", "M14", "Evidence informs reusable patterns and productization."],
  ["M4", "M5", "Automation operates through the application/API boundary."],
  ["M6", "M7", "MCP tool access remains subject to security controls."],
  ["M5", "FDE", "FDE API provides the domain execution boundary."],
  ["FDE", "FDE-MASTERY", "FDE API routes into the domain-oriented FDE platform."],
  ["THREATFADE", "M7", "ThreatFade is a distinct security product and public engineering evidence source; it is not a Tinlance subsystem."],
] as const;

export type CaseStudyType =
  | "CUSTOMER_CASE_STUDY"
  | "ENGINEERING_CASE_STUDY"
  | "OPEN_SOURCE_VALIDATION"
  | "RESEARCH_VALIDATION"
  | "SYNTHETIC_EVALUATION"
  | "ARCHITECTURE_CASE_STUDY";

export type CaseStudyRecord = {
  id: string;
  title: string;
  category: CaseStudyType;
  product: string;
  domain?: string;
  problem: string;
  approach: string;
  evidence: string;
  result: string;
  methodology?: string;
  scope: string;
  limitations: string;
  status: EvidenceStatus;
  public: boolean;
  source?: string;
  sourceUrl?: string;
};

export const caseStudies: CaseStudyRecord[] = [
  {
    id: "threatfade-quic-validation",
    title: "ThreatFade early QUIC C2 validation",
    category: "OPEN_SOURCE_VALIDATION",
    product: "ThreatFade",
    domain: "Cybersecurity",
    problem: "Adversarial C2 activity can reduce observable signals intentionally.",
    approach: "Use entropy/statistical deviation analysis and evidence preservation to identify signal reduction in encrypted traffic.",
    evidence: "Historical, independently documented early MVP validation in the public ThreatFade repository.",
    result: "The documented test population reports a Merlin QUIC z-score of 14.76 and 0% false positives across the tested MVP populations.",
    methodology: "Packet-level test population with statistical deviation analysis.",
    scope: "Early MVP test population; 490,847 documented packets.",
    limitations: "Historical experimental evidence. It does not establish universal accuracy, enterprise production performance, certification, or customer deployment.",
    status: "VALIDATED",
    public: true,
    source: "ThreatFade public repository",
    sourceUrl: "https://github.com/LloydCoder/tinlance-threatfade",
  },
  {
    id: "fde-mastery-platform",
    title: "FDE Mastery platform engineering",
    category: "ENGINEERING_CASE_STUDY",
    product: "FDE Mastery",
    problem: "Enterprise AI workflows need explicit domain contracts, controls, evaluation and evidence.",
    approach: "Build a reusable platform with eight domain contracts, trust-plane controls, durable workflows and evaluation boundaries.",
    evidence: "Public repository documentation, automated test suites and documented engineering history.",
    result: "Repository evidence covers eight domains, production Docker/runtime smoke, eight-domain API E2E and an 800-case synthetic corpus.",
    methodology: "Repository CI and reproducible synthetic/contract evaluation.",
    scope: "Engineering repository evidence; not eight customer deployments.",
    limitations: "Does not establish customer production outcomes or independent assurance.",
    status: "TESTED",
    public: true,
    source: "FDE Mastery public repository",
    sourceUrl: "https://github.com/LloydCoder/fde-mastery",
  },
];

export const publicEvidence = Object.values({
  threatfade: {
    ...({} as EvidenceRecord),
  },
});

export const evidenceTypeLabel: Record<EvidenceType, string> = {
  SOURCE_CODE: "Source code",
  AUTOMATED_TEST: "Automated test",
  E2E_TEST: "E2E test",
  BENCHMARK: "Benchmark",
  SYNTHETIC_EVALUATION: "Synthetic evaluation",
  INDEPENDENT_VALIDATION: "Independent validation",
  PRODUCTION_EVIDENCE: "Production evidence",
  RESEARCH: "Research",
  DOCUMENTATION: "Documentation",
  ARCHITECTURE: "Architecture",
  SECURITY_VERIFICATION: "Security verification",
};
