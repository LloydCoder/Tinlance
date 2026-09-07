"use client";

import { useState } from "react";

type Playbook = {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  objective: string;
};
type Assessment = { id: string; type: string; status: string; objective: string };
type Run = Record<string, unknown>;

export function WorkflowClient({
  projectId,
  playbooks,
  initialRuns,
  assessments,
}: {
  projectId: string;
  playbooks: Playbook[];
  initialRuns: Run[];
  assessments: Assessment[];
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id ?? "");

  async function start(slug: string) {
    if (!assessmentId) {
      setMessage(
        "Create or scope an assessment before starting the FDE Technical Assessment playbook."
      );
      return;
    }
    setBusy(slug);
    setMessage("");
    try {
      const idempotencyKey = `${projectId}:${slug}:${assessmentId}:${crypto.randomUUID()}`;
      const response = await fetch(
        `/api/v1/automation/playbooks/${encodeURIComponent(slug)}/runs`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            projectId,
            assessmentId,
            scope: { projectId, assessmentId },
            context: { customerControlledContentIsUntrusted: true },
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start workflow");
      setRuns((current) => [data.run, ...current]);
      setMessage(
        "Workflow started. It will continue even if you leave this page."
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to start workflow"
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="portal-section">
      <div className="portal-panel">
        <p className="kicker">ASSESSMENT CONTEXT</p>
        <h2>Choose the assessment to automate.</h2>
        {assessments.length ? (
          <select
            aria-label="Assessment"
            value={assessmentId}
            onChange={(event) => setAssessmentId(event.target.value)}
          >
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.type} · {assessment.status}
              </option>
            ))}
          </select>
        ) : (
          <p>
            No workspace assessment exists for this project yet. Create one from
            the Assessments tab.
          </p>
        )}
      </div>
      <div className="portal-two-col">
        {playbooks.map((playbook) => (
          <article className="portal-panel" key={playbook.id}>
            <p className="kicker">PLAYBOOK · v{playbook.version}</p>
            <h2>{playbook.name}</h2>
            <p>{playbook.description}</p>
            <p className="portal-muted">{playbook.objective}</p>
            <button
              type="button"
              className="button"
              onClick={() => start(playbook.slug)}
              disabled={busy !== null || assessments.length === 0}
            >
              {busy === playbook.slug ? "Starting…" : "Start assessment"}
            </button>
          </article>
        ))}
      </div>
      {message ? <p role="status" className="portal-notice">{message}</p> : null}
      <div className="portal-section-head">
        <div>
          <p className="kicker">EXECUTION HISTORY</p>
          <h2>Workflow runs</h2>
        </div>
      </div>
      <div className="portal-project-list">
        {runs.length === 0 ? (
          <div className="portal-panel"><p>No automation runs yet.</p></div>
        ) : (
          runs.map((run, index) => (
            <article className="portal-panel" key={String(run.id ?? index)}>
              <div className="portal-project-footer">
                <strong>{String(run.playbook_name ?? "FDE workflow")}</strong>
                <span>{String(run.status ?? "UNKNOWN")}</span>
              </div>
              <p className="portal-muted">
                Version {String(run.playbook_version ?? "—")} · Step {String(run.current_step ?? "0")} · Trigger {String(run.trigger_type ?? "—")}
              </p>
              <p className="portal-muted">
                Run ID: <code>{String(run.id ?? "—")}</code>
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
