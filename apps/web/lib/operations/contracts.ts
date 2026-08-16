import { z } from "zod";

export const leadStatusSchema = z.enum([
  "new",
  "qualified",
  "assessment",
  "proposal",
  "won",
  "lost",
]);

export const leadSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  country: z.string().trim().min(2).max(80),
  service: z.string().trim().min(2).max(120),
  status: leadStatusSchema.default("new"),
});

export const assessmentBookingSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  startsAt: z.string().datetime({ offset: true }),
  timezone: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(4000).optional(),
});

export const invoiceSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  currency: z.enum(["NGN", "USD", "EUR", "GBP"]),
  amountMinor: z.number().int().positive(),
  description: z.string().trim().min(2).max(500),
});

export type Lead = z.infer<typeof leadSchema>;
export type AssessmentBooking = z.infer<typeof assessmentBookingSchema>;
export type InvoiceRequest = z.infer<typeof invoiceSchema>;
