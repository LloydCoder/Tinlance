import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { PortalShell } from "../../components/portal-shell";

const projects = [
  {
    name: "AI Operations Platform",
    status: "In delivery",
    progress: 68,
    updated: "Updated 2h ago",
  },
  {
    name: "Security Assessment",
    status: "Review",
    progress: 92,
    updated: "Updated yesterday",
  },
];

export default async function PortalPage() {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const name =
    user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "Client";

  return (
    <PortalShell active="overview">
      <div className="portal-page-head">
        <div>
          <p className="kicker">
            CLIENT WORKSPACE / {orgId ? "ORGANIZATION" : "PERSONAL"}
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
          <strong>2</strong>
          <span>Active projects</span>
        </article>
        <article className="portal-stat-card">
          <Clock3 size={20} aria-hidden="true" />
          <strong>1</strong>
          <span>Decision awaiting you</span>
        </article>
        <article className="portal-stat-card">
          <MessageSquare size={20} aria-hidden="true" />
          <strong>4</strong>
          <span>Unread messages</span>
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
          {projects.map((project) => (
            <article className="portal-project" key={project.name}>
              <div className="portal-project-copy">
                <span className="portal-project-status">
                  <span aria-hidden="true" />
                  {project.status}
                </span>
                <h3>{project.name}</h3>
                <p>{project.updated}</p>
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
          ))}
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
            Access is scoped to your authenticated workspace. Operational
            controls and audit history will attach to the same tenant boundary.
          </p>
          <Link className="text-link" href="/portal/settings">
            Workspace settings <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </PortalShell>
  );
}
