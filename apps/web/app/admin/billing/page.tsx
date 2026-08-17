import { redirect } from "next/navigation";
import { AdminResourcePage } from "../../../components/admin-resource-page";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { db } from "../../../lib/db";

export default async function BillingPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  const invoices = await db.invoice.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows = invoices.map((invoice) => ({
    name: `${invoice.id} · ${invoice.organization.name}`,
    detail: `${invoice.currency} ${(invoice.amountMinor / 100).toFixed(2)}`,
    status: invoice.status,
    meta: invoice.createdAt.toLocaleDateString(),
  }));

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
