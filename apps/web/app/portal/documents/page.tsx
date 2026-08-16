import { Download, FileText, LockKeyhole } from "lucide-react";
import { PortalShell } from "../../../components/portal-shell";

const documents = [
  { name: "Security assessment report", meta: "PDF · Restricted · Aug 15", state: "Ready" },
  { name: "Project statement of work", meta: "PDF · Contract · Aug 08", state: "Ready" },
  { name: "Architecture decision record", meta: "PDF · Technical · Aug 12", state: "Ready" },
];

export default function DocumentsPage() {
  return <PortalShell active="documents"><div className="portal-page-head"><div><p className="kicker">DOCUMENTS</p><h1>Your project files.</h1><p>Important delivery and security documents stay inside your authenticated workspace.</p></div></div><section className="portal-docs"><div className="portal-docs-head"><span><LockKeyhole size={16} aria-hidden="true" />Tenant-scoped</span><span>3 documents</span></div>{documents.map((doc) => <article className="portal-doc" key={doc.name}><div className="portal-doc-icon"><FileText size={19} aria-hidden="true" /></div><div><h2>{doc.name}</h2><p>{doc.meta}</p></div><span className="portal-doc-state">{doc.state}</span><button type="button" aria-label={`Download ${doc.name}`} className="icon-button"><Download size={17} aria-hidden="true" /></button></article>)}</section></PortalShell>;
}
