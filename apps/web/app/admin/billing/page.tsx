import { AdminResourcePage } from "../../../components/admin-resource-page";
import { db } from "../../../lib/db";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { redirect } from "next/navigation";

export default async function BillingPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  const invoices = await db.invoice.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows = invoices.map((invoice) => [
    `${invoice.id} · ${invoice.organization.name}`,
    `${invoice.currency} ${(invoice.amountMinor / 100).toFixed(2)}`,
    invoice.status,
    invoice.createdAt.toLocaleDateString(),
  ]);

  return (
    <AdminResourcePage
      active="billing"
      kicker="FINANCE / BILLING"
      title="Billing operations."
      description="Keep invoices, collection state, and client payment context visible without putting payment secrets in the frontend."
      columns={["Invoice", "Amount", "State", "Created"]}
      rows={rows}
    />
  );
}
