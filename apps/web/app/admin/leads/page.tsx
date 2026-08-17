import { AdminResourcePage } from "../../../components/admin-resource-page";
import { db } from "../../../lib/db";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { redirect } from "next/navigation";

export default async function LeadsPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const rows = leads.map((lead) => [
    lead.organizationName,
    lead.service,
    lead.createdAt.toLocaleString(),
    lead.status,
  ]);

  return (
    <AdminResourcePage
      active="leads"
      kicker="PIPELINE / LEADS"
      title="Lead operations."
      description="Review persisted inbound demand and move qualified opportunities through the Tinlance sales process."
      columns={["Lead", "Need", "Activity", "Status"]}
      rows={rows}
    />
  );
}
