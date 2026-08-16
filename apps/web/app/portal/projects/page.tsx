import { ArrowUpRight, CheckCircle2, CircleDashed } from "lucide-react";
import { PortalShell } from "../../../components/portal-shell";

const projects = [
  {
    name: "AI Operations Platform",
    type: "AI Engineering / FDE",
    status: "In delivery",
    progress: 68,
    next: "Integration review",
    due: "Aug 21",
  },
  {
    name: "Security Assessment",
    type: "Cybersecurity Engineering",
    status: "Review",
    progress: 92,
    next: "Approve findings",
    due: "Aug 18",
  },
];

export default function ProjectsPage() {
  return (
    <PortalShell active="projects">
      <div className="portal-page-head">
        <div>
          <p className="kicker">DELIVERY / PROJECTS</p>
          <h1>Your projects.</h1>
          <p>Milestones, current state, and the next decision in one place.</p>
        </div>
      </div>
      <div className="portal-project-list portal-project-list-large">
        {projects.map((project) => (
          <article className="portal-project-detail" key={project.name}>
            <div className="portal-project-copy">
              <span className="portal-project-status">
                <span aria-hidden="true" />
                {project.status}
              </span>
              <h2>{project.name}</h2>
              <p>{project.type}</p>
            </div>
            <div className="portal-detail-metrics">
              <span>
                Progress<strong>{project.progress}%</strong>
              </span>
              <span>
                Next<strong>{project.next}</strong>
              </span>
              <span>
                Target<strong>{project.due}</strong>
              </span>
            </div>
            <div className="portal-progress">
              <div style={{ width: `${project.progress}%` }} />
            </div>
            <div className="portal-project-footer">
              <span>
                {project.progress === 100 ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <CircleDashed size={16} aria-hidden="true" />
                )}{" "}
                Delivery milestone tracked
              </span>
              <button type="button" className="text-link">
                Open project <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </PortalShell>
  );
}
