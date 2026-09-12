import type { CSSProperties } from "react";
import {
  EVIDENCE_STATUS_META,
  type EvidenceStatus,
} from "../lib/evidence/taxonomy";

type EvidenceStatusProps = {
  status: EvidenceStatus;
  className?: string;
};

const statusStyle: Record<EvidenceStatus, CSSProperties> = {
  IMPLEMENTED: { borderColor: "#b8c6aa", background: "#f2f6ec" },
  TESTED: { borderColor: "#aebfd1", background: "#eff4f8" },
  VALIDATED: { borderColor: "#9ebca8", background: "#edf6ef" },
  EXPERIMENTAL: { borderColor: "#cbb89a", background: "#f8f3ea" },
  PLANNED: { borderColor: "#c5c9c6", background: "#f2f3f2" },
};

export function EvidenceStatusBadge({ status, className = "" }: EvidenceStatusProps) {
  const meta = EVIDENCE_STATUS_META[status];
  return (
    <span
      className={`evidence-status evidence-status-${status.toLowerCase()} ${className}`.trim()}
      title={meta.definition}
      aria-label={`Evidence status: ${meta.label}. ${meta.definition}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        border: "1px solid",
        borderRadius: "999px",
        padding: "0.3rem 0.55rem",
        fontSize: "0.68rem",
        fontWeight: 800,
        letterSpacing: "0.04em",
        ...statusStyle[status],
      }}
    >
      <span aria-hidden="true" className="evidence-status-mark" style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor" }} />
      Status: {meta.label}
    </span>
  );
}

export function EvidenceStatusLegend() {
  return (
    <div className="evidence-legend" aria-label="Evidence status definitions" style={{ display: "grid", gap: "0.8rem" }}>
      {Object.entries(EVIDENCE_STATUS_META).map(([status, meta]) => (
        <div className="evidence-legend-item" key={status} style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "0.8rem", alignItems: "center" }}>
          <EvidenceStatusBadge status={status as EvidenceStatus} />
          <span>{meta.definition}</span>
        </div>
      ))}
    </div>
  );
}
