import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { PortalShell } from "../../../../../components/portal-shell";
import { ProjectNav } from "../../../../../components/workspace/project-nav";
import { auth } from "../../../../../lib/auth";
import { authorizeProject } from "../../../../../lib/workspace/authorization";
import { db } from "../../../../../lib/db";
import { WorkflowClient } from "../../../../../components/workspace/workflow-client";

export default async function WorkflowsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackURL=/portal/projects");
  const { projectId } = await params;
  const authorized = await authorizeProject(projectId, "project:read");
  if (!authorized) notFound();
  const [playbooks, runs, assessments] = await Promise.all([
    db.$queryRaw<Array<{ id: string; slug: string; name: string; description: string; version: string; objective: string }>>`
      SELECT p.id,p.slug,p.name,p.description,v.version,v.objective
      FROM "automation_playbooks" p JOIN "automation_playbook_versions" v ON v.playbook_id=p.id
      WHERE p.status='ACTIVE' AND (p."organization_id" IS NULL OR p."organization_id"=${authorized.project.organizationId})
        AND v."active_at" IS NOT NULL AND v."deprecated_at" IS NULL ORDER BY p.name
    `,
    db.$queryRaw<Array<Record<string, unknown>>>`
      SELECT r.id,r.status,r."trigger_type",r."current_step",r."started_at",r."completed_at",p.name AS "playbook_name",v.version AS "playbook_version"
      FROM "automation_workflow_runs" r JOIN "automation_playbooks" p ON p.id=r."playbook_id" JOIN "automation_playbook_versions" v ON v.id=r."playbook_version_id"
      WHERE r."organization_id"=${authorized.project.organizationId} AND r."project_id"=${projectId}
      ORDER BY r."created_at" DESC LIMIT 25
    `,
    db.$queryRaw<Array<{ id: string; type: string; status: string; objective: string }>>`
      SELECT id,type,status,objective FROM "WorkspaceAssessment" WHERE "organizationId"=${authorized.project.organizationId} AND "projectId"=${projectId} ORDER BY "createdAt" DESC LIMIT 10
    `,
  ]);
  return <PortalShell active="projects"><div className="portal-page-head"><div><p className="kicker">FDE AUTOMATION / WORKFLOWS</p><h1>Automate repeatable FDE work.</h1><p>Run versioned playbooks with durable execution, evidence provenance and explicit human approval.</p></div></div><ProjectNav projectId={projectId} active="workflows" /><WorkflowClient projectId={projectId} playbooks={playbooks} initialRuns={runs} assessments={assessments} /></PortalShell>;
}
