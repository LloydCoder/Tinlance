import { Building2, KeyRound, ShieldCheck } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "../../../components/portal-shell";
import { requireOrganization } from "../../../lib/tenant";
import { auth } from "../../../lib/auth";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackURL=/portal/settings");
  const organization = await requireOrganization(
    session.session.activeOrganizationId,
    session.user.id,
  );

  return (
    <PortalShell active="settings">
      <div className="portal-page-head">
        <div>
          <p className="kicker">WORKSPACE / SETTINGS</p>
          <h1>Workspace controls.</h1>
          <p>
            Identity, organization, and security controls are enforced at the
            authenticated tenant boundary.
          </p>
        </div>
      </div>
      <div className="portal-settings-grid">
        <section className="portal-panel">
          <Building2 size={21} aria-hidden="true" />
          <p className="kicker">ORGANIZATION</p>
          <h2>{organization?.name ?? "Personal workspace"}</h2>
          <p>
            Organization membership and role management are handled through
            Better Auth. Server-side data access is scoped to the active
            organization.
          </p>
        </section>
        <section className="portal-panel">
          <KeyRound size={21} aria-hidden="true" />
          <p className="kicker">IDENTITY</p>
          <h2>Authentication</h2>
          <p>
            Sign-in and session management are handled by Better Auth with
            database-backed sessions in Neon Postgres.
          </p>
        </section>
        <section className="portal-panel portal-panel-dark">
          <ShieldCheck size={21} aria-hidden="true" />
          <p className="kicker kicker-dark">SECURITY</p>
          <h2>Tenant isolation</h2>
          <p>
            Protected portal queries resolve the active organization from the
            authenticated session before accessing projects, messages,
            documents, or billing records.
          </p>
        </section>
      </div>
    </PortalShell>
  );
}
