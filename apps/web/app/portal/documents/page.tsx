import { FileText, LockKeyhole } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "../../../components/portal-shell";
import { requireOrganization } from "../../../lib/tenant";
import { db } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export default async function DocumentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackURL=/portal/documents");

  const organization = await requireOrganization(
    session.session.activeOrganizationId,
  );
  const documents = organization
    ? await db.document.findMany({
        where: { organizationId: organization.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <PortalShell active="documents">
      <div className="portal-page-head">
        <div>
          <p className="kicker">DOCUMENTS</p>
          <h1>Your project files.</h1>
          <p>
            Important delivery and security documents stay inside your
            authenticated workspace.
          </p>
        </div>
      </div>
      <section className="portal-docs">
        <div className="portal-docs-head">
          <span>
            <LockKeyhole size={16} aria-hidden="true" /> Tenant-scoped
          </span>
          <span>{documents.length} documents</span>
        </div>
        {documents.length === 0 ? (
          <div className="portal-panel">
            <p className="kicker">NO DOCUMENTS</p>
            <h2>Your document workspace is ready.</h2>
            <p>
              Files will appear here after they are uploaded and assigned to
              this organization.
            </p>
          </div>
        ) : (
          documents.map((document) => (
            <article className="portal-doc" key={document.id}>
              <div className="portal-doc-icon">
                <FileText size={19} aria-hidden="true" />
              </div>
              <div>
                <h2>{document.name}</h2>
                <p>
                  {document.contentType} ·{" "}
                  {document.createdAt.toLocaleDateString()}
                </p>
              </div>
              <span className="portal-doc-state">Available</span>
            </article>
          ))
        )}
      </section>
    </PortalShell>
  );
}
