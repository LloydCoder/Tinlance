import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Secure payment | Tinlance", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

export default async function PaymentPage({ params }: Props) {
  const { token } = await params;
  if (!token || token.length < 32 || token.length > 256) notFound();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const rows = await db.$queryRaw<Array<{ entityId: string; expiresAt: Date; consumedAt: Date | null }>>`SELECT "entityId", "expiresAt", "consumedAt" FROM "CommercialToken" WHERE "kind" = 'payment' AND "tokenHash" = ${tokenHash} LIMIT 1`;
  if (!rows[0] || rows[0].consumedAt || rows[0].expiresAt <= new Date()) notFound();
  const invoices = await db.$queryRaw<Array<{ amountMinor: number; currency: string; status: string; description: string }>>`SELECT "amountMinor", "currency", "status", "description" FROM "Invoice" WHERE "id" = ${rows[0].entityId} LIMIT 1`;
  const invoice = invoices[0];
  if (!invoice || ["paid", "refunded"].includes(invoice.status)) notFound();
  const amount = new Intl.NumberFormat("en-NG", { style: "currency", currency: invoice.currency }).format(invoice.amountMinor / 100);
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-black/60">Tinlance secure payment</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Complete your payment</h1>
        <p className="mt-3 text-black/70">{invoice.description}</p>
        <div className="mt-8 rounded-xl bg-black/[0.03] p-5">
          <div className="flex items-center justify-between gap-4"><span className="text-black/60">Amount</span><strong className="text-xl">{amount}</strong></div>
          <div className="mt-2 flex items-center justify-between gap-4 text-sm"><span className="text-black/60">Status</span><span className="capitalize">{invoice.status}</span></div>
        </div>
        <form className="mt-8" action="/api/v1/billing/paystack/initialize" method="post">
          <input type="hidden" name="token" value={token} />
          <button className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white transition-opacity hover:opacity-90" type="submit">Continue to secure Paystack checkout</button>
        </form>
        <p className="mt-4 text-xs leading-5 text-black/50">Payment confirmation is determined by verified Paystack server events, not by this page or the browser.</p>
      </section>
    </main>
  );
}
