import { redirect } from "next/navigation";
import { AdminResourcePage } from "../../../components/admin-resource-page";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { db } from "../../../lib/db";

export default async function OpportunitiesPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");
  const opportunities = await db.opportunity.findMany({ include: { lead: { select: { organizationName: true, contactName: true, service: true } }, organization: { select: { name: true } } }, orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }], take: 100 });
  const now = Date.now();
  const rows = opportunities.map((opportunity) => ({
    name: opportunity.organization?.name ?? opportunity.lead.organizationName,
    detail: `${opportunity.lead.service} · ${opportunity.lead.contactName}`,
    status: opportunity.stage,
    meta: `${opportunity.nextAction ?? "No next action"}${opportunity.nextActionAt ? ` · ${opportunity.nextActionAt.toLocaleDateString()}` : ""}${opportunity.nextActionAt && opportunity.nextActionAt.getTime() < now ? " · STALE" : ""}`,
  }));
  return <AdminResourcePage active="opportunities" kicker="COMMERCIAL ENGINE / OPPORTUNITIES" title="Commercial pipeline." description="Every active opportunity has a controlled stage, owner context and next action. Stale work is surfaced instead of disappearing into a spreadsheet." columns={["Opportunity", "Need / contact", "Activity", "Stage"]} rows={rows} />;
}
