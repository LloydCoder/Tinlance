import type { Assessment } from "@prisma/client";

export type QualificationDimension = {
  name: string;
  score: number;
  max: number;
  reason: string;
};

export type QualificationResult = {
  score: number;
  maxScore: number;
  status: "QUALIFIED" | "DISQUALIFIED";
  dimensions: QualificationDimension[];
  why: string;
  missing: string[];
  nextAction: string;
};

const has = (value: string | null | undefined) => Boolean(value?.trim());

export function qualifyAssessment(input: Pick<Assessment, "problem" | "workflow" | "currentArchitecture" | "constraints" | "desiredOutcome" | "urgency" | "stakeholders" | "existingSystems" | "securityRequirements" | "businessImpact"> & { budgetSignal?: string | null; companySize?: string | null; roleTitle?: string | null; technicalEnvironment?: string | null; securitySensitivity?: string | null }): QualificationResult {
  const dimensions: QualificationDimension[] = [
    {
      name: "Problem",
      score: has(input.problem) ? 15 : 0,
      max: 15,
      reason: has(input.problem) ? "A concrete problem statement was supplied." : "No concrete problem is defined yet.",
    },
    {
      name: "Impact",
      score: has(input.businessImpact) || has(input.desiredOutcome) ? 15 : 0,
      max: 15,
      reason: has(input.businessImpact) ? "Business impact is described." : has(input.desiredOutcome) ? "A desired outcome is defined, but impact needs validation." : "Business impact/outcome is missing.",
    },
    {
      name: "Fit",
      score: 15,
      max: 15,
      reason: "Assessment entered through a Tinlance capability path, so capability fit is presumed pending technical confirmation.",
    },
    {
      name: "Authority",
      score: has(input.roleTitle) ? 10 : has(input.stakeholders) ? 6 : 0,
      max: 10,
      reason: has(input.roleTitle) ? `Role supplied: ${input.roleTitle}.` : has(input.stakeholders) ? "Stakeholders are identified but decision authority is not explicit." : "Decision authority is not identified.",
    },
    {
      name: "Timing",
      score: input.urgency === "urgent" ? 10 : input.urgency === "30_days" ? 9 : input.urgency === "90_days" ? 7 : 3,
      max: 10,
      reason: `Declared urgency: ${input.urgency ?? "unknown"}.`,
    },
    {
      name: "Complexity",
      score: has(input.workflow) || has(input.currentArchitecture) || has(input.technicalEnvironment) ? 10 : 4,
      max: 10,
      reason: has(input.currentArchitecture) || has(input.technicalEnvironment) ? "Technical environment/architecture is supplied." : "Technical complexity still needs discovery.",
    },
    {
      name: "Budget",
      score: input.budgetSignal === "100k_plus" ? 10 : input.budgetSignal === "25k_100k" ? 9 : input.budgetSignal === "5k_25k" ? 7 : input.budgetSignal === "under_5k" ? 2 : 1,
      max: 10,
      reason: `Budget signal: ${input.budgetSignal ?? "unknown"}.`,
    },
    {
      name: "Technical readiness",
      score: has(input.existingSystems) || has(input.technicalEnvironment) ? 5 : 1,
      max: 5,
      reason: has(input.existingSystems) || has(input.technicalEnvironment) ? "Existing systems or technical environment are identified." : "Technical readiness is not yet established.",
    },
    {
      name: "Security/compliance",
      score: has(input.securityRequirements) || input.securitySensitivity === "critical" || input.securitySensitivity === "regulated" ? 5 : 3,
      max: 5,
      reason: has(input.securityRequirements) ? "Security requirements are explicitly stated." : "No detailed security requirements were supplied yet.",
    },
  ];

  const maxScore = dimensions.reduce((sum, item) => sum + item.max, 0);
  const score = dimensions.reduce((sum, item) => sum + item.score, 0);
  const missing = dimensions.filter((item) => item.score < item.max).map((item) => item.name);
  const status = score >= 65 && has(input.problem) && has(input.desiredOutcome) ? "QUALIFIED" : "DISQUALIFIED";
  const nextAction = status === "QUALIFIED" ? "Schedule technical discovery" : "Review missing qualification evidence";
  const why = status === "QUALIFIED"
    ? `Qualified at ${score}/${maxScore}: the assessment shows a material problem, outcome, and sufficient commercial/technical signals for human discovery.`
    : `Not qualified at ${score}/${maxScore}: qualification evidence is insufficient for a confident commercial handoff.`;

  return { score, maxScore, status, dimensions, why, missing, nextAction };
}
