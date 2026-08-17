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
          <p className="kicker">CONTENT / GOVERNANCE</p>
          <h1>Content governance.</h1>
          <p>
            Review the publication standards that protect research, case-study,
            and SEO content. Editing and publishing remain repository-controlled
            until a dedicated CMS workflow is connected.
          </p>
        </div>
      </div>
      <div className="admin-control-grid">
        <article className="admin-control">
          <FileText size={20} aria-hidden="true" />
          <h2>Research library</h2>
          <p>
            Long-form technical research is versioned in the repository and
            reviewed before it reaches the public site.
          </p>
          <code>draft → review → approved → published</code>
        </article>
        <article className="admin-control">
          <PenLine size={20} aria-hidden="true" />
          <h2>Case studies</h2>
          <p>
            Proof, outcomes, project context, and publication state remain
            reviewable before public release.
          </p>
          <code>private → internal → public</code>
        </article>
        <article className="admin-control">
          <Search size={20} aria-hidden="true" />
          <h2>SEO health</h2>
          <p>
            Metadata, canonical URLs, structured data, sitemap, and internal
            links are validated as application code.
          </p>
          <code>indexable → canonical → schema</code>
        </article>
        <article className="admin-control">
          <ShieldCheck size={20} aria-hidden="true" />
          <h2>Publishing guardrail</h2>
          <p>
            Public content changes remain separated from client and privileged
            operational data and pass the repository's review gates.
          </p>
          <code>role: super-admin | admin</code>
        </article>
      </div>
    </AdminShell>
  );
}
