import { AdminResourcePage } from "../../../components/admin-resource-page";
import { db } from "../../../lib/db";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  const clients = await db.organization.findMany({
    include: { projects: { orderBy: { updatedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows = clients.map((client) => [
    client.name,
    client.projects[0]?.name ?? "No active engagement",
    "Active",
    client.projects[0]?.status ?? "Onboarding",
  ]);

  return (
    <AdminResourcePage
      active="clients"
      kicker="DELIVERY / CLIENTS"
      title="Client operations."
      description="Keep account context, engagement state, and onboarding visibility in the privileged workspace."
      columns={["Client", "Engagement", "Account", "Plan"]}
      rows={rows}
    />
  );
}
