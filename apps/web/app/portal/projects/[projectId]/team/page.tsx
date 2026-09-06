import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { PortalShell } from "../../../../../components/portal-shell";
import { ProjectNav } from "../../../../../components/workspace/project-nav";
import { auth } from "../../../../../lib/auth";
import { authorizeProject } from "../../../../../lib/workspace/authorization";
import { db } from "../../../../../lib/db";

export default async function TeamPage({ params }: { params: Promise<{ projectId: string }> }) { const session = await auth.api.getSession({ headers: await headers() }); if (!session) redirect("/sign-in"); const { projectId } = await params; const authorized = await authorizeProject(projectId, "team:read"); if (!authorized) notFound(); const members = await db.member.findMany({ where: { organizationId: authorized.project.organizationId }, select: { role: true, user: { select: { id: true, name: true, email: true } } }, take: 100 }); return <PortalShell active="projects"><div className="portal-page-head"><div><p className="kicker">TEAM / ACCESS</p><h1>Project team.</h1><p>Organization membership remains authoritative for customer access.</p></div></div><ProjectNav projectId={projectId} active="team" /><div className="portal-project-list">{members.map((member) => <article className="portal-project-detail" key={member.user.id}><div className="portal-project-copy"><span className="portal-project-status"><span aria-hidden="true" />{member.role}</span><h2>{member.user.name}</h2><p>{member.user.email}</p></div></article>)}</div></PortalShell>; }
