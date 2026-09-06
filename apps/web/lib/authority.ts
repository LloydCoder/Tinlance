export const SITE_URL = "https://tinlance.com";

export type ContentStatus =
  | "CURRENT_IMPLEMENTED"
  | "CURRENT_VERIFIED"
  | "HISTORICAL_VERIFIED"
  | "EXPERIMENTAL"
  | "PLANNED"
  | "DEPRECATED"
  | "UNKNOWN";

export type EvidenceLevel =
  | "CLIENT-PROVIDED"
  | "TINLANCE-MEASURED"
  | "EXTERNALLY-VERIFIED"
  | "HISTORICAL"
  | "ESTIMATED"
  | "QUALITATIVE";

export type ContentType =
  | "article"
  | "guide"
  | "research"
  | "case-study"
  | "resource"
  | "documentation"
  | "glossary"
  | "announcement";

export type Author = {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  url: string;
  organization: string;
};

export type ResearchItem = {
  slug: string;
  type: "research";
  title: string;
  summary: string;
  abstract: string;
  researchQuestion: string;
  context: string;
  methodology: string[];
  dataset: string;
  environment: string;
  results: string[];
  limitations: string[];
  evidence: EvidenceLevel[];
  status: ContentStatus;
  authors: string[];
  publishedAt: string;
  updatedAt: string;
  reviewedAt: string;
  relatedServices: string[];
  relatedResearch: string[];
  relatedCaseStudies: string[];
  references: string[];
  cta: string;
  canonicalPath: string;
};

export type CaseStudy = {
  slug: string;
  type: "case-study";
  title: string;
  summary: string;
  problem: string;
  context: string;
  constraints: string[];
  approach: string[];
  architecture: string[];
  securityConsiderations: string[];
  evidence: EvidenceLevel[];
  results: string[];
  lessons: string[];
  limitations: string[];
  technologies: string[];
  outcome: string;
  status: ContentStatus;
  publishedAt: string;
  updatedAt: string;
  reviewedAt: string;
  authors: string[];
  relatedServices: string[];
  canonicalPath: string;
};

export const authors: Author[] = [
  {
    id: "tinlance-engineering",
    name: "Tinlance Engineering",
    role: "Engineering team",
    expertise: [
      "AI engineering",
      "AI security",
      "Forward-Deployed Engineering",
      "security engineering",
    ],
    url: `${SITE_URL}/about`,
    organization: "Tinlance",
  },
];

export const researchItems: ResearchItem[] = [
  {
    slug: "threatfade-quic-c2-detection",
    type: "research",
    title: "ThreatFade: How We Detected QUIC-Based C2 Evasion at Scale",
    summary:
      "An early ThreatFade investigation using entropy and behavioural z-score analysis against a controlled Merlin QUIC C2 packet capture.",
    abstract:
      "This research records an early ThreatFade MVP validation experiment. The experiment evaluated whether behavioural statistics could distinguish a known Merlin QUIC C2 traffic population from the clean test populations used in the experiment.",
    researchQuestion:
      "Can behavioural statistical signals help identify Merlin QUIC C2 traffic when payload inspection is limited by encrypted transport?",
    context:
      "ThreatFade was developed to investigate deliberate operational silencing and evasive beaconing behaviour in encrypted network traffic. This page preserves the historical experiment without treating it as a universal production claim.",
    methodology: [
      "Analyse packet-level traffic from a controlled Merlin QUIC C2 capture.",
      "Derive rolling entropy and behavioural z-score signals from the observed traffic characteristics.",
      "Compare the resulting signal against the clean/test populations used in the MVP experiment.",
      "Record the observed z-score and false-positive result with the dataset scope attached.",
    ],
    dataset:
      "A test PCAP containing 490,847 packets of real Merlin QUIC C2 traffic, together with the clean/test populations used for the reported MVP false-positive evaluation.",
    environment:
      "ThreatFade MVP research environment; packet capture analysis rather than a general enterprise production deployment.",
    results: [
      "The reported Merlin QUIC C2 population produced a z-score of 14.76 in the experiment.",
      "The reported result was 0% false positives across the tested MVP populations.",
      "The dataset and result demonstrate a useful research signal, but do not establish production-wide detection performance.",
    ],
    limitations: [
      "The experiment does not establish performance across arbitrary enterprise networks, encrypted applications, or unseen malware families.",
      "The clean/test populations are not equivalent to a representative enterprise background-traffic corpus.",
      "The historical result should not be interpreted as a current universal false-positive or detection-rate guarantee.",
      "Further validation is required against broader, independently constructed datasets and current engine releases.",
    ],
    evidence: ["HISTORICAL", "TINLANCE-MEASURED"],
    status: "HISTORICAL_VERIFIED",
    authors: ["tinlance-engineering"],
    publishedAt: "2026-05-29",
    updatedAt: "2026-09-06",
    reviewedAt: "2026-09-06",
    relatedServices: ["ai-security", "forward-deployed-engineering"],
    relatedResearch: [],
    relatedCaseStudies: [],
    references: [
      "https://github.com/LloydCoder/tinlance-threatfade",
      "https://github.com/LloydCoder/Tinlance/blob/main/docs/migrations/threatfade-evidence-matrix.md",
    ],
    cta: "Discuss an AI security assessment",
    canonicalPath: "/research/threatfade-quic-c2-detection",
  },
];

export const caseStudies: CaseStudy[] = [];

export const authorityTaxonomy = {
  pillars: [
    "AI Engineering",
    "Forward-Deployed Engineering",
    "AI Security",
    "Enterprise Automation",
  ],
  supportingTopics: [
    "Cybersecurity",
    "AI Agents",
    "RAG",
    "Production AI",
    "AI Infrastructure",
    "Security Engineering",
  ],
};

export function getAuthor(id: string): Author | undefined {
  return authors.find((author) => author.id === id);
}

export function validateAuthorityContent(): string[] {
  const errors: string[] = [];
  const seenPaths = new Set<string>();

  for (const item of [...researchItems, ...caseStudies]) {
    if (!item.slug) errors.push("content item is missing slug");
    if (!item.title) errors.push(`${item.slug}: missing title`);
    if (!item.summary) errors.push(`${item.slug}: missing summary`);
    if (!item.canonicalPath) errors.push(`${item.slug}: missing canonical path`);
    if (seenPaths.has(item.canonicalPath)) {
      errors.push(`${item.slug}: duplicate canonical path ${item.canonicalPath}`);
    }
    seenPaths.add(item.canonicalPath);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt)) {
      errors.push(`${item.slug}: invalid publishedAt`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt)) {
      errors.push(`${item.slug}: invalid updatedAt`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.reviewedAt)) {
      errors.push(`${item.slug}: invalid reviewedAt`);
    }
    for (const authorId of item.authors) {
      if (!getAuthor(authorId)) errors.push(`${item.slug}: unknown author ${authorId}`);
    }
    for (const service of item.relatedServices) {
      if (!service) errors.push(`${item.slug}: empty related service reference`);
    }
  }

  return errors;
}
