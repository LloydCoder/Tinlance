import { KeyRound, LockKeyhole, ScrollText, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../components/admin-shell";
import { getAuthorizationContext } from "../../../lib/auth/authorization";

export default async function ControlsPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  return (
    <AdminShell active="controls">
      <div className="admin-page-head">
        <div>
          <p className="kicker">SECURITY / CONTROLS</p>
          <h1>Privileged controls.</h1>
          <p>
            This read-only surface records the security boundaries enforced by
            the current platform. High-impact mutations remain behind reviewed
            server-side workflows.
          </p>
        </div>
      </div>
      <div className="admin-control-grid">
        <article className="admin-control">
          <ShieldCheck size={20} aria-hidden="true" />
          <h2>Role boundary</h2>
          <p>
            Administrative access is resolved server-side through the Tinlance
            authorization context before privileged data is queried.
          </p>
          <code>super-admin | admin</code>
        </article>
        <article className="admin-control">
          <LockKeyhole size={20} aria-hidden="true" />
          <h2>Audit trail</h2>
          <p>
            Persisted lead, booking, billing webhook, and other material
            operations emit correlation-aware audit events in PostgreSQL.
          </p>
          <code>actor + action + target + request ID</code>
        </article>
        <article className="admin-control">
          <KeyRound size={20} aria-hidden="true" />
          <h2>Secrets</h2>
          <p>
            Payment, identity, database, rate-limit, and FDE credentials remain
            server-side and production configuration is validated explicitly.
          </p>
          <code>server-only secret boundary</code>
        </article>
        <article className="admin-control">
          <ScrollText size={20} aria-hidden="true" />
          <h2>Change management</h2>
          <p>
            Production code changes pass the repository's required security,
            dependency, test, build, container, SBOM, and enterprise gates.
          </p>
          <code>change → validate → audit → deploy</code>
        </article>
      </div>
    </AdminShell>
  );
}
