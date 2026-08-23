import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ensureOrganization } from "../../lib/tenant";
import { db } from "../../lib/db";
import { auth } from "../../lib/auth";

export default async function PortalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackURL=/portal");

  const organizationId = session.session.activeOrganizationId;
  const organization = await ensureOrganization(organizationId, session.user.id);
  const name = session.user.name || session.user.email || "Client";

  const [projects, messageCount, openInvoices] = organization
    ? await Promise.all([
        db.project.findMany({
          where: { organizationId: organization.id },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        db.message.count({ where: { organizationId: organization.id } }),
        db.invoice.count({
          where: {
            organizationId: organization.id,
            status: { in: ["draft", "sent", "overdue"] },
          },
        }),
      ])
    : [[], 0, 0];

  return (
    <PortalShell active="overview">
      <div className="portal-page-head">
        <div>
          <p className="kicker">
            CLIENT WORKSPACE / {organization ? "ORGANIZATION" : "PERSONAL"}
          </p>
          <h1>Good to see you, {name}.</h1>
          <p>
            One secure workspace for delivery, decisions, files, and
            communication with Tinlance.
          </p>
        </div>
        <Link className="button button-dark" href="/assessment">
          Start a new assessment <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>

      <div className="portal-stat-grid" aria-label="Workspace summary">
        <article className="portal-stat-card">
          <FolderKanban size={20} aria-hidden="true" />
          <strong>{projects.length}</strong>
          <span>Active projects</span>
        </article>
        <article className="portal-stat-card">
          <Clock3 size={20} aria-hidden="true" />
          <strong>{openInvoices}</strong>
          <span>Open billing items</span>
        </article>
        <article className="portal-stat-card">
          <MessageSquare size={20} aria-hidden="true" />
          <strong>{messageCount}</strong>
          <span>Messages</span>
        </article>
        <article className="portal-stat-card">
          <ShieldCheck size={20} aria-hidden="true" />
          <strong>100%</strong>
          <span>Workspace protected</span>
        </article>
      </div>

      <section className="portal-section">
        <div className="portal-section-head">
          <div>
            <p className="kicker">DELIVERY</p>
            <h2>Active projects</h2>
          </div>
          <Link className="text-link" href="/portal/projects">
            View all <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="portal-project-list">
          {projects.length === 0 ? (
            <div className="portal-panel">
              <p className="kicker">NO ACTIVE PROJECTS</p>
              <h2>Your delivery workspace is ready.</h2>
              <p>
                Projects will appear here as soon as they are assigned to this
                organization.
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <article className="portal-project" key={project.id}>
                <div className="portal-project-copy">
                  <span className="portal-project-status">
                    <span aria-hidden="true" />
                    {project.status}
                  </span>
                  <h3>{project.name}</h3>
                  <p>{project.updatedAt.toLocaleDateString()}</p>
                </div>
                <div
                  className="portal-progress"
                  aria-label={`${project.progress}% complete`}
                >
                  <div style={{ width: `${project.progress}%` }} />
                </div>
                <strong>{project.progress}%</strong>
                <ArrowUpRight size={18} aria-hidden="true" />
              </article>
            ))
          )}
        </div>
      </section>

      <div className="portal-two-col">
        <section className="portal-panel">
          <div className="portal-panel-icon">
            <MessageSquare size={19} aria-hidden="true" />
          </div>
          <p className="kicker">COMMUNICATIONS</p>
          <h2>Keep decisions moving.</h2>
          <p>
            Your project thread, delivery updates, and important decisions stay
            together instead of disappearing into email.
          </p>
          <Link className="text-link" href="/portal/messages">
            Open messages <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
        <section className="portal-panel portal-panel-dark">
          <CheckCircle2 size={22} aria-hidden="true" />
          <p className="kicker kicker-dark">SECURITY</p>
          <h2>Built for sensitive work.</h2>
          <p>
            Access is scoped to your authenticated organization. Server-side
            queries enforce the same tenant boundary.
          </p>
          <Link className="text-link" href="/portal/settings">
            Workspace settings <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </PortalShell>
  );
}
