import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { PortalShell } from "../../../../../components/portal-shell";
import { ProjectNav } from "../../../../../components/workspace/project-nav";
import { auth } from "../../../../../lib/auth";
import { authorizeProject } from "../../../../../lib/workspace/authorization";
import { db } from "../../../../../lib/db";

export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) { const session = await auth.api.getSession({ headers: await headers() }); if (!session) redirect("/sign-in"); const { projectId } = await params; const authorized = await authorizeProject(projectId, "project:read"); if (!authorized) notFound(); const events = await db.auditEvent.findMany({ where: { organizationId: authorized.project.organizationId, resourceType: "project", resourceId: projectId }, orderBy: { createdAt: "desc" }, take: 100 }); return <PortalShell active="projects"><div className="portal-page-head"><div><p className="kicker">ACTIVITY / AUDIT</p><h1>Project activity.</h1><p>Customer-visible activity is a filtered projection of the canonical audit trail.</p></div></div><ProjectNav projectId={projectId} active="activity" /><div className="portal-project-list">{events.length ? events.map((event) => <article className="portal-project-detail" key={event.id}><div className="portal-project-copy"><span className="portal-project-status"><span aria-hidden="true" />{event.action}</span><h2>{event.resourceType}</h2><p>{event.createdAt.toLocaleString()}</p></div></article>) : <section className="portal-panel"><p className="kicker">NO ACTIVITY</p><h2>No customer-visible project activity yet.</h2></section>}</div></PortalShell>; }
