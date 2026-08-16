import { AdminResourcePage } from "../../../components/admin-resource-page";

const rows = [
  {
    name: "AI Operations Platform",
    detail: "FDE delivery",
    status: "On track",
    meta: "68%",
  },
  {
    name: "Security Assessment",
    detail: "Cybersecurity",
    status: "Review",
    meta: "92%",
  },
  {
    name: "Agent Reliability Program",
    detail: "AI infrastructure",
    status: "Attention",
    meta: "41%",
  },
  {
    name: "Cloud Migration",
    detail: "Platform engineering",
    status: "Planning",
    meta: "Kickoff",
  },
];

export default function ProjectsPage() {
  return (
    <AdminResourcePage
      active="projects"
      kicker="DELIVERY / PROJECTS"
      title="Project operations."
      description="Monitor active engagements, milestones, delivery risk, and the next decision required from the team."
      columns={["Project", "Engagement", "State", "Progress"]}
      rows={rows}
    />
  );
}
