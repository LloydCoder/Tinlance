import { OpportunityStage } from "@prisma/client";

const transitions: Record<OpportunityStage, readonly OpportunityStage[]> = {
  NEW: ["ASSESSMENT_REQUESTED", "QUALIFYING", "DISQUALIFIED"],
  ASSESSMENT_REQUESTED: ["QUALIFYING", "DISQUALIFIED"],
  QUALIFYING: ["QUALIFIED", "DISQUALIFIED", "ASSESSMENT_REQUESTED"],
  QUALIFIED: ["BOOKING_PENDING", "ASSESSMENT_COMPLETE", "DISQUALIFIED"],
  DISQUALIFIED: ["QUALIFYING"],
  BOOKING_PENDING: ["BOOKED", "QUALIFYING"],
  BOOKED: ["ASSESSMENT_COMPLETE", "QUALIFYING"],
  ASSESSMENT_COMPLETE: ["PROPOSAL_DRAFT", "QUALIFYING"],
  PROPOSAL_DRAFT: ["PROPOSAL_SENT", "ASSESSMENT_COMPLETE"],
  PROPOSAL_SENT: ["PROPOSAL_VIEWED", "NEGOTIATING", "ACCEPTED", "DECLINED", "ENGAGEMENT_PENDING"],
  PROPOSAL_VIEWED: ["NEGOTIATING", "ACCEPTED", "DECLINED", "ENGAGEMENT_PENDING"],
  NEGOTIATING: ["PROPOSAL_DRAFT", "ACCEPTED", "DECLINED"],
  ACCEPTED: ["ENGAGEMENT_PENDING"],
  DECLINED: ["QUALIFYING"],
  ENGAGEMENT_PENDING: ["ACTIVE", "DECLINED"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: [],
};

export function canTransition(from: OpportunityStage, to: OpportunityStage) {
  return transitions[from].includes(to);
}

export function assertTransition(from: OpportunityStage, to: OpportunityStage) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid opportunity transition: ${from} -> ${to}`);
  }
}

export function transitionTargets(from: OpportunityStage) {
  return [...transitions[from]];
}
