"use client";

import { useState } from "react";

type Playbook = { id: string; slug: string; name: string; description: string; version: string; objective: string };
type Run = Record<string, unknown>;

export function WorkflowClient({ projectId, playbooks, initialRuns }: { projectId: string; playbooks: Playbook[]; initialRuns: Run[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function start(slug: string) {
    setBusy(slug); setMessage("");
    try {
      const response = await fetch(`/api/v1/automation/playbooks/${encodeURIComponent(slug)}/runs`, { method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": `${projectId}:${slug}:${Date.now()}` }, body: JSON.stringify({ projectId, scope: { projectId }, context: { customerControlledContentIsUntrusted: true } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start workflow");
      setRuns((current) => [data.run, ...current]); setMessage("Workflow started. It will continue even if you leave this page.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to start workflow"); }
    finally { setBusy(null); }
  }

  return <section className="portal-section"><div className="portal-two-col">{playbooks.map((playbook) => <article className="portal-panel" key={playbook.id}><p className="kicker">PLAYBOOK · v{playbook.version}</p><h2>{playbook.name}</h2><p>{playbook.description}</p><p className="portal-muted">{playbook.objective}</p><button type="button" className="button" onClick={() => start(playbook.slug)} disabled={busy !== null}>{busy === playbook.slug ? "Starting…" : "Start assessment"}</button></article>)}</div>{message ? <p role="status" className="portal-notice">{message}</p> : null}<div className="portal-section-head"><div><p className="kicker">EXECUTION HISTORY</p><h2>Workflow runs</h2></div></div><div className="portal-project-list">{runs.length === 0 ? <div className="portal-panel"><p>No automation runs yet.</p></div> : runs.map((run, index) => <article className="portal-panel" key={String(run.id ?? index)}><div className="portal-project-footer"><strong>{String(run.playbook_name ?? "FDE workflow")}</strong><span>{String(run.status ?? "UNKNOWN")}</span></div><p className="portal-muted">Version {String(run.playbook_version ?? "—")} · Step {String(run.current_step ?? "0")} · Trigger {String(run.trigger_type ?? "—")}</p><p className="portal-muted">Run ID: <code>{String(run.id ?? "—")}</code></p></article>)}</div></section>;
}
