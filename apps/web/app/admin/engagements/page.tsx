import { redirect } from "next/navigation";
import { AdminResourcePage } from "../../../components/admin-resource-page";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { db } from "../../../lib/db";

export default async function EngagementsPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");
  const engagements = await db.engagement.findMany({ include: { organization: { select: { name: true } }, client: { select: { status: true } }, projects: { select: { progress: true } } }, orderBy: { updatedAt: "desc" }, take: 100 });
  const rows = engagements.map((engagement) => ({ name: engagement.name, detail: engagement.organization.name, status: engagement.status, meta: `${engagement.deliveryModel} · ${engagement.projects[0]?.progress ?? 0}% project progress` }));
  return <AdminResourcePage active="engagements" kicker="COMMERCIAL ENGINE / ENGAGEMENTS" title="Active engagements." description="Accepted commercial work becomes a canonical client, engagement and project without leaving the commercial system." columns={["Engagement", "Organization", "Delivery", "Status"]} rows={rows} />;
}
