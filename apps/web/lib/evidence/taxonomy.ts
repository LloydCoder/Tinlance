export const EVIDENCE_STATUSES = [
  "IMPLEMENTED",
  "TESTED",
  "VALIDATED",
  "EXPERIMENTAL",
  "PLANNED",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EVIDENCE_TYPES = [
  "SOURCE_CODE",
  "AUTOMATED_TEST",
  "E2E_TEST",
  "BENCHMARK",
  "SYNTHETIC_EVALUATION",
  "INDEPENDENT_VALIDATION",
  "PRODUCTION_EVIDENCE",
  "RESEARCH",
  "DOCUMENTATION",
  "ARCHITECTURE",
  "SECURITY_VERIFICATION",
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_STATUS_META: Record<
  EvidenceStatus,
  { label: string; definition: string }
> = {
  IMPLEMENTED: {
    label: "Implemented",
    definition: "Exists in the current implementation.",
  },
  TESTED: {
    label: "Tested",
    definition: "Covered by automated or reproducible tests demonstrating the stated behavior.",
  },
  VALIDATED: {
    label: "Validated",
    definition: "Supported by documented validation beyond ordinary implementation or unit testing, with scope stated.",
  },
  EXPERIMENTAL: {
    label: "Experimental",
    definition: "Implemented for research or evaluation; production suitability has not been established.",
  },
  PLANNED: {
    label: "Planned",
    definition: "Intentionally identified for future implementation and not currently implemented.",
  },
};

export type EvidenceRecord = {
  id: string;
  title: string;
  status: EvidenceStatus;
  evidenceType: EvidenceType;
  description: string;
  scope?: string;
  source?: string;
  sourceUrl?: string;
  repository?: string;
  commit?: string;
  version?: string;
  date?: string;
  methodology?: string;
  dataset?: string;
  sampleSize?: string;
  environment?: string;
  result?: string;
  limitations?: string;
  public: boolean;
};

export const evidenceRecords = {
  threatfadeQuicBaseline: {
    id: "threatfade-quic-baseline",
    title: "ThreatFade early QUIC C2 baseline",
    status: "VALIDATED",
    evidenceType: "INDEPENDENT_VALIDATION",
    description: "Historical, independently documented early ThreatFade MVP validation against the stated test population.",
    scope: "Early MVP test population; not a universal detection-accuracy claim.",
    source: "ThreatFade public repository documentation",
    sourceUrl: "https://github.com/LloydCoder/tinlance-threatfade",
    repository: "LloydCoder/tinlance-threatfade",
    version: "early MVP",
    methodology: "Documented packet-level test population and statistical deviation analysis.",
    dataset: "Merlin QUIC C2 test population",
    sampleSize: "490,847 packets",
    result: "Merlin QUIC z-score 14.76; the documented baseline reports 0% false positives across the tested MVP populations.",
    limitations: "Historical experimental result for the documented population; it does not establish universal current accuracy, enterprise production performance, certification, or customer deployment.",
    public: true,
  },
  fdeMasteryEngineering: {
    id: "fde-mastery-engineering",
    title: "FDE Mastery engineering evidence",
    status: "TESTED",
    evidenceType: "AUTOMATED_TEST",
    description: "Repository evidence for the reusable FDE platform and its engineering controls.",
    scope: "Repository-level engineering and contract evidence; not proof of eight production deployments.",
    source: "FDE Mastery public repository",
    sourceUrl: "https://github.com/LloydCoder/fde-mastery",
    repository: "LloydCoder/fde-mastery",
    methodology: "Repository CI, domain contract tests, deployment smoke coverage and documented engineering controls.",
    result: "The repository documents an eight-domain platform and a 30-build engineering history.",
    limitations: "Engineering evidence does not establish customer production deployment, customer outcomes, or independent assurance.",
    public: true,
  },
  fdsePublicArchitecture: {
    id: "fdse-public-architecture",
    title: "FDSE public architecture and responsibility boundary",
    status: "TESTED",
    evidenceType: "ARCHITECTURE",
    description: "Tinlance public presentation of FDSE engineering intelligence and assurance responsibilities, including its boundary with FDE Mastery and governed execution authority.",
    scope: "Public website architecture and repository-backed responsibility model; not proof of live production integration or customer deployment.",
    source: "Tinlance FDSE website implementation and public FDSE repository",
    sourceUrl: "https://www.tinlance.com/engineering/fdse",
    repository: "LloydCoder/Tinlance",
    commit: "a6194c5b9c83484ab2de61df5a8f89ee6e4c6da3",
    methodology: "Repository implementation, CI verification and explicit responsibility-boundary review.",
    result: "The public FDSE architecture route is implemented and repository CI-verified.",
    limitations: "Architecture and repository evidence do not establish live production integration, customer outcomes, certification or independent assurance.",
    public: true,
  },
  agentPlatformContract: {
    id: "agent-platform-r10-contract",
    title: "Tinlance Agent Platform governed-execution.v1 contract",
    status: "TESTED",
    evidenceType: "ARCHITECTURE",
    description: "Public repository evidence for the Agent Platform's generic governed execution authority and R10 contract.",
    scope: "Repository-level contract/reference implementation evidence; not proof of a deployed production environment.",
    source: "Tinlance Agent Platform public repository",
    sourceUrl: "https://github.com/LloydCoder/tinlance-agent-platform",
    repository: "LloydCoder/tinlance-agent-platform",
    commit: "775132611af59d301abd4f03d86d4bcdf6806fef",
    methodology: "Repository architecture, R10 governed-execution contract and final M29 repository assurance documentation.",
    result: "The public repository documents governed-execution.v1 and records the M0-M29 repository engineering sequence as complete.",
    limitations: "Repository completion does not establish live external infrastructure, deployment, customer integration or independent assurance.",
    public: true,
  },
  tinlanceCi: {
    id: "tinlance-ci",
    title: "Tinlance repository quality gates",
    status: "TESTED",
    evidenceType: "AUTOMATED_TEST",
    description: "Automated repository gates covering application, API, security and supply-chain checks.",
    scope: "Current repository CI configuration.",
    source: "Tinlance GitHub Actions",
    sourceUrl: "https://github.com/LloydCoder/Tinlance/actions",
    repository: "LloydCoder/Tinlance",
    methodology: "Type checking, linting, tests, builds, dependency audits, SAST, secret scanning, container validation and SBOM validation as configured by CI.",
    limitations: "A green CI run demonstrates repository checks for the tested revision; it is not customer-specific production validation.",
    public: true,
  },
} satisfies Record<string, EvidenceRecord>;

export const evidenceStatus = (status: string): EvidenceStatus =>
  EVIDENCE_STATUSES.includes(status as EvidenceStatus)
    ? (status as EvidenceStatus)
    : "PLANNED";
