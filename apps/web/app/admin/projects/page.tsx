import { redirect } from "next/navigation";
import { AdminResourcePage } from "../../../components/admin-resource-page";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { db } from "../../../lib/db";

export default async function ProjectsPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const rows = projects.map((project) => ({
    name: project.name,
    detail: project.type ?? "Engineering",
    status: project.status,
    meta: `${project.progress}%`,
  }));

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
