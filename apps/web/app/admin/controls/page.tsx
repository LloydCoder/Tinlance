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
      <div className="admin-page-head"><div><p className="kicker">SECURITY / CONTROLS</p><h1>Privileged controls.</h1><p>High-impact controls are documented here before implementation is connected to live infrastructure.</p></div></div>
      <div className="admin-control-grid">
        <article className="admin-control"><ShieldCheck size={20} aria-hidden="true" /><h2>Role boundary</h2><p>Administrative access is resolved server-side through the Tinlance authorization context.</p><code>super-admin | admin</code></article>
        <article className="admin-control"><LockKeyhole size={20} aria-hidden="true" /><h2>Audit trail</h2><p>Privileged mutations should emit immutable audit events with actor, target, action, and correlation ID.</p><code>actor + action + target + time</code></article>
        <article className="admin-control"><KeyRound size={20} aria-hidden="true" /><h2>Secrets</h2><p>Payment, CRM, identity, and infrastructure credentials never belong in browser state or rendered HTML.</p><code>server-only secret boundary</code></article>
        <article className="admin-control"><ScrollText size={20} aria-hidden="true" /><h2>Change management</h2><p>Production-impacting operations should remain reviewable and independently traceable.</p><code>request → authorize → mutate → audit</code></article>
      </div>
    </AdminShell>
  );
}
