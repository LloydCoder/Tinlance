import { AdminResourcePage } from "../../../components/admin-resource-page";
import { db } from "../../../lib/db";
import { getAuthorizationContext } from "../../../lib/auth/authorization";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  const projects = await db.project.findMany({
    include: { organization: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const rows = projects.map((project) => [
    project.name,
    project.type ?? "Engineering",
    project.status,
    `${project.progress}%`,
  ]);

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
