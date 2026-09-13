export type CommercialState = "DRAFT" | "INTERNAL_REVIEW" | "READY" | "SENT" | "VIEWED" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
export type PaymentState = "CREATED" | "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type EntitlementState = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED" | "CANCELLED";
export type OnboardingState = "NOT_STARTED" | "INVITED" | "IN_PROGRESS" | "CUSTOMER_ACTION_REQUIRED" | "INTERNAL_REVIEW" | "READY_FOR_PROVISIONING" | "PROVISIONING" | "ACTIVE" | "BLOCKED" | "FAILED" | "COMPLETED";
export type ProvisioningState = "REQUESTED" | "RUNNING" | "COMPLETED" | "FAILED" | "BLOCKED";

const proposalTransitions: Record<CommercialState, CommercialState[]> = {
  DRAFT: ["INTERNAL_REVIEW", "CANCELLED"], INTERNAL_REVIEW: ["READY", "CANCELLED"], READY: ["SENT", "CANCELLED"], SENT: ["VIEWED", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"], VIEWED: ["ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"], ACCEPTED: ["CANCELLED"], DECLINED: [], EXPIRED: [], CANCELLED: [],
};
const paymentTransitions: Record<PaymentState, PaymentState[]> = {
  CREATED: ["PENDING", "CANCELLED", "EXPIRED"], PENDING: ["PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED"], PROCESSING: ["SUCCEEDED", "FAILED", "CANCELLED"], SUCCEEDED: ["REFUNDED", "PARTIALLY_REFUNDED"], FAILED: ["PENDING", "CANCELLED"], CANCELLED: [], EXPIRED: [], REFUNDED: [], PARTIALLY_REFUNDED: ["REFUNDED"],
};
const entitlementTransitions: Record<EntitlementState, EntitlementState[]> = { PENDING: ["ACTIVE", "CANCELLED"], ACTIVE: ["SUSPENDED", "EXPIRED", "REVOKED"], SUSPENDED: ["ACTIVE", "REVOKED", "EXPIRED"], EXPIRED: [], REVOKED: [], CANCELLED: [] };
const onboardingTransitions: Record<OnboardingState, OnboardingState[]> = { NOT_STARTED: ["INVITED", "IN_PROGRESS", "BLOCKED"], INVITED: ["IN_PROGRESS", "CUSTOMER_ACTION_REQUIRED", "BLOCKED"], IN_PROGRESS: ["CUSTOMER_ACTION_REQUIRED", "INTERNAL_REVIEW", "READY_FOR_PROVISIONING", "BLOCKED", "FAILED"], CUSTOMER_ACTION_REQUIRED: ["IN_PROGRESS", "BLOCKED", "FAILED"], INTERNAL_REVIEW: ["READY_FOR_PROVISIONING", "CUSTOMER_ACTION_REQUIRED", "BLOCKED", "FAILED"], READY_FOR_PROVISIONING: ["PROVISIONING", "BLOCKED", "FAILED"], PROVISIONING: ["ACTIVE", "BLOCKED", "FAILED"], ACTIVE: ["COMPLETED", "BLOCKED"], BLOCKED: ["IN_PROGRESS", "FAILED"], FAILED: ["IN_PROGRESS", "BLOCKED"], COMPLETED: [] };
const provisioningTransitions: Record<ProvisioningState, ProvisioningState[]> = { REQUESTED: ["RUNNING", "FAILED", "BLOCKED"], RUNNING: ["COMPLETED", "FAILED", "BLOCKED"], COMPLETED: [], FAILED: ["REQUESTED", "RUNNING", "BLOCKED"], BLOCKED: ["REQUESTED", "RUNNING"] };

export function canTransition<T extends string>(map: Record<T, T[]>, current: T, next: T) { return current === next || map[current].includes(next); }
export const canProposalTransition = (current: CommercialState, next: CommercialState) => canTransition(proposalTransitions, current, next);
export const canPaymentTransition = (current: PaymentState, next: PaymentState) => canTransition(paymentTransitions, current, next);
export const canEntitlementTransition = (current: EntitlementState, next: EntitlementState) => canTransition(entitlementTransitions, current, next);
export const canOnboardingTransition = (current: OnboardingState, next: OnboardingState) => canTransition(onboardingTransitions, current, next);
export const canProvisioningTransition = (current: ProvisioningState, next: ProvisioningState) => canTransition(provisioningTransitions, current, next);

export function validateMoney(amountMinor: number, currency: string) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("invalid_amount");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("invalid_currency");
  return { amountMinor, currency };
}
export function validatePaymentAgainstInvoice(input: { invoiceAmountMinor: number; invoiceCurrency: string; providerAmountMinor: number; providerCurrency: string }) {
  validateMoney(input.invoiceAmountMinor, input.invoiceCurrency);
  if (input.providerAmountMinor !== input.invoiceAmountMinor) throw new Error("amount_mismatch");
  if (input.providerCurrency.toUpperCase() !== input.invoiceCurrency.toUpperCase()) throw new Error("currency_mismatch");
  return true;
}
export function deterministicProvisioningKey(entitlementId: string) { return `provision:${entitlementId}`; }
