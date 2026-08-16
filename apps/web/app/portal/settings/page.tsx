import { Building2, KeyRound, ShieldCheck } from "lucide-react";
import { PortalShell } from "../../../components/portal-shell";

export default function SettingsPage() {
  return (
    <PortalShell active="settings">
      <div className="portal-page-head">
        <div>
          <p className="kicker">WORKSPACE / SETTINGS</p>
          <h1>Workspace controls.</h1>
          <p>
            Identity, organization, and security controls belong at the tenant
            boundary.
          </p>
        </div>
      </div>
      <div className="portal-settings-grid">
        <section className="portal-panel">
          <Building2 size={21} aria-hidden="true" />
          <p className="kicker">ORGANIZATION</p>
          <h2>Team access</h2>
          <p>
            Organization membership and role management are handled through the
            authenticated identity layer.
          </p>
        </section>
        <section className="portal-panel">
          <KeyRound size={21} aria-hidden="true" />
          <p className="kicker">IDENTITY</p>
          <h2>Authentication</h2>
          <p>
            Sign-in, session management, MFA, and enterprise identity
            connections are delegated to Clerk.
          </p>
        </section>
        <section className="portal-panel portal-panel-dark">
          <ShieldCheck size={21} aria-hidden="true" />
          <p className="kicker kicker-dark">SECURITY</p>
          <h2>Tenant isolation</h2>
          <p>
            Future operational records will be resolved from the active
            organization context before authorization or data access.
          </p>
        </section>
      </div>
    </PortalShell>
  );
}
