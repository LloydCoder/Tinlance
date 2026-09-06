import { redirect } from "next/navigation";
import { AdminResourcePage } from "../../../components/admin-resource-page";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { db } from "../../../lib/db";

export default async function ProposalsPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");
  const proposals = await db.proposal.findMany({ include: { lead: { select: { organizationName: true, contactName: true } } }, orderBy: { updatedAt: "desc" }, take: 100 });
  const rows = proposals.map((proposal) => ({ name: proposal.proposalNumber, detail: `${proposal.lead.organizationName} · ${proposal.title}`, status: proposal.status, meta: `v${proposal.currentVersion}${proposal.expiresAt ? ` · expires ${proposal.expiresAt.toLocaleDateString()}` : ""}` }));
  return <AdminResourcePage active="proposals" kicker="COMMERCIAL ENGINE / PROPOSALS" title="Proposal control." description="Issued proposals are immutable records. Revisions become explicit versions and every send/view/accept action is auditable." columns={["Proposal", "Account", "Activity", "Status"]} rows={rows} />;
}
