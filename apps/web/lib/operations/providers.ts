export type PaymentProvider = "paystack" | "flutterwave" | "wise" | "payoneer";

export interface PaymentIntent {
  reference: string;
  amountMinor: number;
  currency: "NGN" | "USD" | "EUR" | "GBP";
  customerEmail: string;
  description: string;
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  createPaymentIntent(input: PaymentIntent): Promise<{ checkoutUrl: string; reference: string }>;
}

export interface CrmLead {
  organizationName: string;
  contactName: string;
  email: string;
  country: string;
  service: string;
}

export interface CrmAdapter {
  createLead(input: CrmLead): Promise<{ externalId: string }>;
}

export interface InvoiceAdapter {
  createInvoice(input: PaymentIntent & { organizationId: string }): Promise<{ externalId: string }>;
}
