"use client";

import { useState } from "react";

export function AutomationOps({ initialRuns }: { initialRuns: Array<Record<string, unknown>> }) {
  const [runs, setRuns] = useState(initialRuns);
  const [busy, setBusy] = useState<string | null>(null);

  async function control(runId: string, action: string, organizationId: string) {
    setBusy(`${runId}:${action}`);
    try {
      const response = await fetch(`/api/v1/automation/runs/${runId}/control`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, organizationId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Control action failed");
      setRuns((current) => current.map((run) => String(run.id) === runId ? { ...run, ...data.run } : run));
    } finally { setBusy(null); }
  }

  return <section className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Workflow</th><th>Organization</th><th>Status</th><th>Step</th><th>Updated</th><th>Controls</th></tr></thead><tbody>{runs.map((run) => { const id=String(run.id); const status=String(run.status); const organizationId=String(run.organization_id); return <tr key={id}><td><strong>{String(run.playbook_name ?? "FDE workflow")}</strong><br /><code>{id}</code></td><td><code>{organizationId}</code></td><td>{status}</td><td>{String(run.current_step ?? "0")}</td><td>{String(run.updated_at ?? "—")}</td><td><div className="admin-actions">{["RUNNING","RETRYING","WAITING"].includes(status) ? <button disabled={busy!==null} onClick={()=>control(id,"pause",organizationId)}>Pause</button> : null}{status === "PAUSED" ? <button disabled={busy!==null} onClick={()=>control(id,"resume",organizationId)}>Resume</button> : null}{status === "FAILED" ? <button disabled={busy!==null} onClick={()=>control(id,"retry",organizationId)}>Retry</button> : null}{!["COMPLETED","FAILED","CANCELLED","EXPIRED"].includes(status) ? <button disabled={busy!==null} onClick={()=>control(id,"cancel",organizationId)}>Cancel</button> : null}</div></td></tr>;})}</tbody></table></section>;
}
