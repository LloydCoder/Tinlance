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

const metrics = [
  ["Open leads", "18", "5 new this week", Users],
  ["Active clients", "7", "2 in onboarding", BriefcaseBusiness],
  ["Projects in delivery", "11", "3 need attention", ShieldCheck],
  ["Outstanding invoices", "$42.8k", "6 invoices open", CreditCard],
] as const;

export default async function AdminPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  return (
    <AdminShell active="overview">
      <div className="admin-page-head">
        <div>
          <p className="kicker">TINLANCE / CONTROL CENTER</p>
          <h1>Operate the business.</h1>
          <p>
            Privileged workspace for leads, clients, delivery, billing, content,
            and platform controls.
          </p>
        </div>
        <span className="admin-role-badge">
          <ShieldCheck size={15} aria-hidden="true" /> {context.role}
        </span>
      </div>

      <div
        className="admin-metric-grid"
        aria-label="Business operations summary"
      >
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
            <p className="kicker">ATTENTION</p>
            <h2>What needs action</h2>
          </div>
        </div>
        <div className="admin-action-list">
          <article>
            <span className="admin-dot admin-dot-accent" />
            <div>
              <strong>New enterprise assessment</strong>
              <p>Fintech infrastructure team · submitted 42 minutes ago</p>
            </div>
            <Link
              href="/admin/leads"
              aria-label="Review new enterprise assessment"
            >
              <ArrowUpRight size={17} />
            </Link>
          </article>
          <article>
            <span className="admin-dot" />
            <div>
              <strong>Security findings awaiting approval</strong>
              <p>Security Assessment · client decision required</p>
            </div>
            <Link href="/admin/projects" aria-label="Review security findings">
              <ArrowUpRight size={17} />
            </Link>
          </article>
          <article>
            <span className="admin-dot" />
            <div>
              <strong>Invoice approaching due date</strong>
              <p>AI Operations Platform · due in 3 days</p>
            </div>
            <Link href="/admin/billing" aria-label="Review outstanding invoice">
              <ArrowUpRight size={17} />
            </Link>
          </article>
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-panel">
          <FileText size={20} aria-hidden="true" />
          <p className="kicker">CONTENT</p>
          <h2>Publishing queue</h2>
          <p>
            Research and case-study content can be reviewed before publication
            without touching production content directly.
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
            Administrative routes require the existing server-side Tinlance role
            boundary. Client-side navigation never grants access.
          </p>
          <Link href="/admin/controls" className="text-link">
            Review controls <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </AdminShell>
  );
}
