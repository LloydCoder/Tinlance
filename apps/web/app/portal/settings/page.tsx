import { Building2, KeyRound, ShieldCheck } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { PortalShell } from "../../../components/portal-shell";
import { requireOrganization } from "../../../lib/tenant";

export default async function SettingsPage() {
  const { userId, orgId } = await auth();
  if (!userId) return null;
  const organization = await requireOrganization(orgId);

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
            Organization membership and role management are handled through the
            authenticated identity layer. Server-side data access is scoped to
            the active organization.
          </p>
        </section>
        <section className="portal-panel">
          <KeyRound size={21} aria-hidden="true" />
          <p className="kicker">IDENTITY</p>
          <h2>Authentication</h2>
          <p>
            Sign-in, session management, MFA, and enterprise identity
            connections are handled by the configured Clerk production instance.
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
