import { CheckCircle2, CircleDashed } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "../../../components/portal-shell";
import { requireOrganization } from "../../../lib/tenant";
import { db } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackURL=/portal/projects");

  const organization = await requireOrganization(
    session.session.activeOrganizationId,
  );
  const projects = organization
    ? await db.project.findMany({
        where: { organizationId: organization.id },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <PortalShell active="projects">
      <div className="portal-page-head">
        <div>
          <p className="kicker">DELIVERY / PROJECTS</p>
          <h1>Your projects.</h1>
          <p>
            Milestones, current state, and the next decision in one place.
          </p>
        </div>
      </div>
      <div className="portal-project-list portal-project-list-large">
        {projects.length === 0 ? (
          <section className="portal-panel">
            <p className="kicker">NO PROJECTS</p>
            <h2>No delivery records yet.</h2>
            <p>Projects assigned to this organization will appear here.</p>
          </section>
        ) : (
          projects.map((project) => (
            <article className="portal-project-detail" key={project.id}>
              <div className="portal-project-copy">
                <span className="portal-project-status">
                  <span aria-hidden="true" />
                  {project.status}
                </span>
                <h2>{project.name}</h2>
                <p>{project.type ?? "Tinlance engineering engagement"}</p>
              </div>
              <div className="portal-detail-metrics">
                <span>
                  Progress<strong>{project.progress}%</strong>
                </span>
                <span>
                  Next<strong>{project.nextDecision ?? "—"}</strong>
                </span>
                <span>
                  Target
                  <strong>{project.dueAt?.toLocaleDateString() ?? "—"}</strong>
                </span>
              </div>
              <div
                className="portal-progress"
                aria-label={`${project.progress}% complete`}
              >
                <div style={{ width: `${project.progress}%` }} />
              </div>
              <div className="portal-project-footer">
                <span>
                  {project.progress === 100 ? (
                    <CheckCircle2 size={16} aria-hidden="true" />
                  ) : (
                    <CircleDashed size={16} aria-hidden="true" />
                  )}
                  Delivery milestone tracked
                </span>
                <span className="text-link">Current project record</span>
              </div>
            </article>
          ))
        )}
      </div>
    </PortalShell>
  );
}
