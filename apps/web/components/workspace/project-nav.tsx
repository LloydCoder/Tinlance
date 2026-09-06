import Link from "next/link";

export function ProjectNav({ projectId, active }: { projectId: string; active: string }) {
  const links = [
    ["overview", "Overview", `/portal/projects/${projectId}`],
    ["assessments", "Assessments", `/portal/projects/${projectId}/assessments`],
    ["findings", "Findings", `/portal/projects/${projectId}/findings`],
    ["evidence", "Evidence", `/portal/projects/${projectId}/evidence`],
    ["reports", "Reports", `/portal/projects/${projectId}/reports`],
    ["remediation", "Remediation", `/portal/projects/${projectId}/remediation`],
    ["activity", "Activity", `/portal/projects/${projectId}/activity`],
    ["team", "Team", `/portal/projects/${projectId}/team`],
  ] as const;
  return <nav aria-label="Project workspace" className="portal-project-tabs">{links.map(([key, label, href]) => <Link key={key} href={href} className={active === key ? "is-active" : ""} aria-current={active === key ? "page" : undefined}>{label}</Link>)}</nav>;
}
