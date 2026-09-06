import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { PortalShell } from "../../../../components/portal-shell";
import { ProjectNav } from "../../../../components/workspace/project-nav";
import { auth } from "../../../../lib/auth";
import { authorizeProject } from "../../../../lib/workspace/authorization";
import { db } from "../../../../lib/db";
import { ensureProjectWorkspaceState } from "../../../../lib/workspace/service";

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }); if (!session) redirect(`/sign-in?callbackURL=/portal/projects`);
  const { projectId } = await params; const authorized = await authorizeProject(projectId, "project:read"); if (!authorized) notFound();
  const state = await ensureProjectWorkspaceState(projectId, authorized.project.organizationId); if (!state) notFound();
  const [findings, remediation, reports, requests] = await Promise.all([
    db.workspaceFinding.count({ where: { projectId, organizationId: authorized.project.organizationId, visibility: { in: ["CUSTOMER","CUSTOMER_CONFIDENTIAL"] }, status: { in: ["OPEN","ACKNOWLEDGED","IN_PROGRESS","VERIFICATION_PENDING"] } } }),
    db.workspaceRemediation.count({ where: { projectId, organizationId: authorized.project.organizationId, status: { notIn: ["CLOSED","VERIFIED"] } } }),
    db.workspaceReport.count({ where: { projectId, organizationId: authorized.project.organizationId, status: { in: ["APPROVED","PUBLISHED","SUPERSEDED"] } } }),
    db.workspaceEvidenceRequest.count({ where: { projectId, organizationId: authorized.project.organizationId, status: { in: ["REQUESTED","REOPENED","REVIEWING"] } } }),
  ]);
  return <PortalShell active="projects"><div className="portal-page-head"><div><p className="kicker">FDE CUSTOMER WORKSPACE / PROJECT</p><h1>{authorized.project.name}</h1><p>{authorized.project.description ?? "Evidence-backed delivery workspace."}</p></div></div><ProjectNav projectId={projectId} active="overview" /><div className="portal-stat-grid"><article className="portal-stat-card"><strong>{state.status}</strong><span>Project state</span></article><article className="portal-stat-card"><strong>{findings}</strong><span>Open findings</span></article><article className="portal-stat-card"><strong>{remediation}</strong><span>Active remediation</span></article><article className="portal-stat-card"><strong>{requests}</strong><span>Evidence actions</span></article></div><section className="portal-section"><div className="portal-section-head"><div><p className="kicker">NEXT ACTION</p><h2>Keep the engagement moving.</h2></div></div><div className="portal-two-col"><Link className="portal-panel" href={`/portal/projects/${projectId}/evidence`}><p className="kicker">EVIDENCE</p><h2>Review evidence requests.</h2><p>Submit or review evidence without exposing storage paths or internal records.</p></Link><Link className="portal-panel" href={`/portal/projects/${projectId}/findings`}><p className="kicker">FINDINGS</p><h2>Understand what was found.</h2><p>Trace customer-visible findings to assessment evidence and recommendations.</p></Link><Link className="portal-panel" href={`/portal/projects/${projectId}/reports`}><p className="kicker">REPORTS</p><h2>{reports} published report{reports === 1 ? "" : "s"}.</h2><p>Read the current immutable deliverable and its version history.</p></Link><Link className="portal-panel" href={`/portal/projects/${projectId}/remediation`}><p className="kicker">REMEDIATION</p><h2>Track fixes through verification.</h2><p>Customer attestation is separate from independent verification.</p></Link></div></section></PortalShell>;
}
