import {
  EVIDENCE_STATUS_META,
  type EvidenceStatus,
} from "../lib/evidence/taxonomy";

type EvidenceStatusProps = {
  status: EvidenceStatus;
  className?: string;
};

export function EvidenceStatusBadge({ status, className = "" }: EvidenceStatusProps) {
  const meta = EVIDENCE_STATUS_META[status];
  return (
    <span
      className={`evidence-status evidence-status-${status.toLowerCase()} ${className}`.trim()}
      title={meta.definition}
      aria-label={`Evidence status: ${meta.label}. ${meta.definition}`}
    >
      <span aria-hidden="true" className="evidence-status-mark" />
      Status: {meta.label}
    </span>
  );
}

export function EvidenceStatusLegend() {
  return (
    <div className="evidence-legend" aria-label="Evidence status definitions">
      {Object.entries(EVIDENCE_STATUS_META).map(([status, meta]) => (
        <div className="evidence-legend-item" key={status}>
          <EvidenceStatusBadge status={status as EvidenceStatus} />
          <span>{meta.definition}</span>
        </div>
      ))}
    </div>
  );
}
