import { ArrowUpRight, BarChart3, DollarSign, Percent, Users } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "../../../components/admin-shell";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { getRevenueIntelligence } from "../../../lib/revenue-intelligence";

function money(minor: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}
function pct(value: number) { return `${(value * 100).toFixed(1)}%`; }

export default async function RevenueIntelligencePage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");
  const data = await getRevenueIntelligence({ days: 90 });
  const currency = data.commercial.currencies[0] || "USD";

  const metrics = [
    ["Qualified visitors", data.visitors.qualified.toLocaleString(), "Unique anonymous identities at qualified stages", Users],
    ["Won deals", data.commercial.wonDeals.toLocaleString(), "Accepted/active/completed opportunities", BarChart3],
    ["Win rate", pct(data.commercial.winRate), "Won opportunities ÷ leads", Percent],
    ["Contracted revenue", money(data.commercial.contractedRevenueMinor, currency), "Active/completed engagement value", DollarSign],
  ] as const;

  return <AdminShell active="revenue">
    <div className="admin-page-head">
      <div><p className="kicker">TINLANCE / REVENUE INTELLIGENCE</p><h1>See what turns attention into revenue.</h1><p>90-day first-party funnel and commercial intelligence. Attribution is fail-closed when identity joins are not reliable.</p></div>
      <Link href="/admin" className="text-link">Control center <ArrowUpRight size={16} /></Link>
    </div>

    <div className="admin-metric-grid" aria-label="Revenue intelligence summary">
      {metrics.map(([label, value, detail, Icon]) => <article className="admin-metric" key={label}><Icon size={19} aria-hidden="true" /><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}
    </div>

    <section className="admin-section"><div className="admin-section-head"><div><p className="kicker">FULL FUNNEL</p><h2>Conversion path</h2></div></div>
      <div className="admin-action-list">
        {Object.entries(data.funnel).map(([name, count]) => <article key={name}><span className="admin-dot admin-dot-accent" /><div><strong>{name.replaceAll("_", " ")}</strong><p>{count.toLocaleString()} recorded events in the selected window</p></div></article>)}
      </div>
    </section>

    <div className="admin-two-col">
      <section className="admin-panel"><p className="kicker">CHANNEL ATTRIBUTION</p><h2>Revenue by persisted lead source</h2><div className="admin-action-list">{data.channels.length === 0 ? <article><div><strong>No attributed leads yet.</strong><p>Channel attribution appears as commercial records accumulate.</p></div></article> : data.channels.map((channel) => <article key={channel.channel}><div><strong>{channel.channel}</strong><p>{channel.leads} leads · {channel.qualifiedLeads} qualified · {channel.wonDeals} won</p></div><strong>{money(channel.contractedRevenueMinor, currency)}</strong></article>)}</div></section>
      <section className="admin-panel admin-panel-dark"><p className="kicker kicker-dark">RECURRING ECONOMICS</p><h2>Contracted run-rate</h2><p>Active RETAINER and FRACTIONAL_FDE engagements are treated as monthly run-rate. This is a modeled metric, not an accounting ledger.</p><strong style={{ fontSize: "2rem" }}>{money(data.commercial.recurringRunRateMinor, currency)} / mo</strong><p style={{ marginTop: "1rem" }}>Modeled ARR run-rate: {money(data.commercial.modeledArrRunRateMinor, currency)}</p></section>
    </div>

    <section className="admin-section"><div className="admin-section-head"><div><p className="kicker">ATTRIBUTION INTEGRITY</p><h2>What the system will and will not claim</h2></div></div><div className="admin-panel"><p><strong>Current model:</strong> {data.attribution.model}. {data.attribution.note}</p><p style={{ marginTop: "0.75rem" }}><strong>First touch:</strong> {data.attribution.firstTouch}. <strong>Last touch:</strong> {data.attribution.lastTouch}.</p><p style={{ marginTop: "0.75rem" }}>Primary business metric: <strong>revenue per qualified visitor</strong> = {money(data.commercial.revenuePerQualifiedVisitorMinor, currency)} per qualified anonymous visitor.</p></div></section>
  </AdminShell>;
}
