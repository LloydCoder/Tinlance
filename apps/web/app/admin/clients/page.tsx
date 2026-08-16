import { AdminResourcePage } from "../../../components/admin-resource-page";

const rows = [
  {
    name: "Acme Systems",
    detail: "AI Operations Platform",
    status: "Active",
    meta: "Enterprise",
  },
  {
    name: "Northstar Security",
    detail: "Security Engineering",
    status: "Active",
    meta: "Retainer",
  },
  {
    name: "Vertex Labs",
    detail: "FDE engagement",
    status: "Onboarding",
    meta: "Pro",
  },
  {
    name: "Meridian Health",
    detail: "Automation discovery",
    status: "Review",
    meta: "Assessment",
  },
];

export default function ClientsPage() {
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
