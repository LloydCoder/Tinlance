import { ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminShell } from "./admin-shell";
import { getAuthorizationContext } from "../lib/auth/authorization";

type Row = Readonly<{ name: string; detail: string; status: string; meta: string }>;
type AdminResourcePageProps = Readonly<{ active: "leads" | "opportunities" | "proposals" | "engagements" | "clients" | "projects" | "billing" | "content"; kicker: string; title: string; description: string; columns: readonly string[]; rows: readonly Row[] }>;

export async function AdminResourcePage({ active, kicker, title, description, columns, rows }: AdminResourcePageProps) {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");
  return <AdminShell active={active}><div className="admin-page-head"><div><p className="kicker">{kicker}</p><h1>{title}</h1><p>{description}</p></div></div><section className="admin-table" aria-label={title}><div className="admin-table-head">{columns.map((column) => <span key={column}>{column}</span>)}</div>{rows.map((row) => <article className="admin-table-row" key={`${row.name}-${row.status}-${row.meta}`}><strong>{row.name}</strong><span>{row.detail}</span><span><small>{row.meta}</small></span><span className="admin-status">{row.status}</span><ArrowUpRight size={16} aria-hidden="true" /></article>)}</section></AdminShell>;
}
