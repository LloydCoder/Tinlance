import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Payment status | Tinlance", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ reference?: string }> };

export default async function PaymentCallbackPage({ searchParams }: Props) {
  const { reference } = await searchParams;
  const payment = reference ? (await db.$queryRaw<Array<{ status: string; invoiceId: string }>>`SELECT "status", "invoiceId" FROM "Payment" WHERE "provider" = 'paystack' AND "providerReference" = ${reference} LIMIT 1`)[0] : null;
  const success = payment?.status === "SUCCEEDED";
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-black/60">Tinlance payment</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{success ? "Payment received" : "Payment processing"}</h1>
        <p className="mt-4 leading-7 text-black/70">{success ? "Your payment has been verified and your Tinlance workspace activation has been requested." : "Your browser return is not the payment source of truth. Tinlance is waiting for or reconciling the verified provider event."}</p>
        {payment?.invoiceId ? <p className="mt-4 text-sm text-black/50">Invoice: {payment.invoiceId}</p> : null}
        <Link className="mt-8 inline-flex rounded-xl border border-black/10 px-5 py-3 font-medium" href="/">Return to Tinlance</Link>
      </section>
    </main>
  );
}
