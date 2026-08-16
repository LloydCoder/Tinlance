import { FileText, PenLine, Search, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminShell } from "../../../components/admin-shell";
import { getAuthorizationContext } from "../../../lib/auth/authorization";

export default async function ContentPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  return (
    <AdminShell active="content">
      <div className="admin-page-head">
        <div>
          <p className="kicker">CONTENT / PUBLISHING</p>
          <h1>Content operations.</h1>
          <p>
            Review research, case studies, and SEO-critical content before it
            reaches the public site.
          </p>
        </div>
      </div>
      <div className="admin-control-grid">
        <article className="admin-control">
          <FileText size={20} aria-hidden="true" />
          <h2>Research library</h2>
          <p>Manage long-form technical research and evidence-led articles.</p>
          <code>draft → review → approved → published</code>
        </article>
        <article className="admin-control">
          <PenLine size={20} aria-hidden="true" />
          <h2>Case studies</h2>
          <p>
            Maintain proof, outcomes, project context, and publication status.
          </p>
          <code>private → internal → public</code>
        </article>
        <article className="admin-control">
          <Search size={20} aria-hidden="true" />
          <h2>SEO health</h2>
          <p>
            Keep metadata, canonical URLs, structured data, and internal links
            reviewable.
          </p>
          <code>indexable → canonical → schema</code>
        </article>
        <article className="admin-control">
          <ShieldCheck size={20} aria-hidden="true" />
          <h2>Publishing guardrail</h2>
          <p>
            Privileged publishing stays separate from the public marketing
            surface.
          </p>
          <code>role: super-admin | admin</code>
        </article>
      </div>
    </AdminShell>
  );
}
