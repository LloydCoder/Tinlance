import {
  ArrowUpRight,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "../../components/admin-shell";
import { getAuthorizationContext } from "../../lib/auth/authorization";
import { db } from "../../lib/db";

export default async function AdminPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  const [openLeads, activeClients, activeProjects, outstandingInvoices, recentLeads] =
    await Promise.all([
      db.lead.count({ where: { status: { not: "lost" } } }),
      db.organization.count(),
      db.project.count({ where: { status: { not: "completed" } } }),
      db.invoice.count({ where: { status: { in: ["draft", "sent", "overdue"] } } }),
      db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    ]);

  const metrics = [
    ["Open leads", String(openLeads), "Persisted website leads", Users],
    ["Active clients", String(activeClients), "Organizations in the platform", BriefcaseBusiness],
    ["Projects in delivery", String(activeProjects), "Database-backed delivery records", ShieldCheck],
    ["Open invoices", String(outstandingInvoices), "Billing records requiring action", CreditCard],
  ] as const;

  return (
    <AdminShell active="overview">
      <div className="admin-page-head">
        <div>
          <p className="kicker">TINLANCE / CONTROL CENTER</p>
          <h1>Operate the business.</h1>
          <p>
            Privileged workspace for leads, clients, delivery, billing, content, and platform controls.
          </p>
        </div>
        <span className="admin-role-badge">
          <ShieldCheck size={15} aria-hidden="true" /> {context.role}
        </span>
      </div>

      <div className="admin-metric-grid" aria-label="Business operations summary">
        {metrics.map(([label, value, detail, Icon]) => (
          <article className="admin-metric" key={label}>
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </div>

      <section className="admin-section">
        <div className="admin-section-head">
          <div>
            <p className="kicker">RECENT ACTIVITY</p>
            <h2>Latest leads</h2>
          </div>
          <Link href="/admin/leads" className="text-link">
            Open leads <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="admin-action-list">
          {recentLeads.length === 0 ? (
            <article>
              <div>
                <strong>No leads captured yet.</strong>
                <p>New website submissions will appear here after persistence is configured.</p>
              </div>
            </article>
          ) : (
            recentLeads.map((lead) => (
              <article key={lead.id}>
                <span className="admin-dot admin-dot-accent" />
                <div>
                  <strong>{lead.organizationName}</strong>
                  <p>
                    {lead.service} · {lead.status} · {lead.createdAt.toLocaleString()}
                  </p>
                </div>
                <Link
                  href="/admin/leads"
                  aria-label={`Review lead from ${lead.organizationName}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-panel">
          <FileText size={20} aria-hidden="true" />
          <p className="kicker">CONTENT</p>
          <h2>Publishing queue</h2>
          <p>
            Research and case-study content can be reviewed before publication without touching production content directly.
          </p>
          <Link href="/admin/content" className="text-link">
            Open content <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
        <section className="admin-panel admin-panel-dark">
          <ShieldCheck size={20} aria-hidden="true" />
          <p className="kicker kicker-dark">SECURITY</p>
          <h2>Privileged by default.</h2>
          <p>
            Administrative routes require the existing server-side Tinlance role boundary. Client-side navigation never grants access.
          </p>
          <Link href="/admin/controls" className="text-link">
            Review controls <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </AdminShell>
  );
}
