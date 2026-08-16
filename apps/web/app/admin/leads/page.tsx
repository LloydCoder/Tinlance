import { AdminResourcePage } from "../../../components/admin-resource-page";

const rows = [
  { name: "Fintech infrastructure team", detail: "Enterprise assessment", status: "New", meta: "42m ago" },
  { name: "Health automation startup", detail: "AI engineering", status: "Qualified", meta: "Today" },
  { name: "US software agency", detail: "FDE engagement", status: "Discovery", meta: "Yesterday" },
  { name: "European security team", detail: "Threat assessment", status: "Proposal", meta: "Aug 14" },
];

export default function LeadsPage() {
  return <AdminResourcePage active="leads" kicker="PIPELINE / LEADS" title="Lead operations." description="Review inbound demand and move qualified opportunities through the Tinlance sales process." columns={["Lead", "Need", "Activity", "Status"]} rows={rows} />;
}
