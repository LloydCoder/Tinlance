import { AdminShell } from "../../../components/admin-shell";
import { AdminResourcePage } from "../../../components/admin-resource-page";

const rows = [
  { name: "INV-1048 · Acme Systems", detail: "$18,500", status: "Due soon", meta: "Aug 19" },
  { name: "INV-1047 · Northstar Security", detail: "$9,800", status: "Open", meta: "Aug 25" },
  { name: "INV-1042 · Vertex Labs", detail: "$6,400", status: "Paid", meta: "Aug 12" },
];

export default function BillingPage() {
  return <AdminResourcePage active="billing" kicker="FINANCE / BILLING" title="Billing operations." description="Keep invoices, collection state, and client payment context visible without putting payment secrets in the frontend." columns={["Invoice", "Amount", "State", "Due"]} rows={rows} />;
}
