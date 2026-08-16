"use client";

import { BarChart3, BriefcaseBusiness, CreditCard, FileText, LayoutDashboard, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { PortalAuthControls } from "./portal-auth-controls";

const links = [
  ["overview", "/admin", "Overview", LayoutDashboard],
  ["leads", "/admin/leads", "Leads", Users],
  ["clients", "/admin/clients", "Clients", BriefcaseBusiness],
  ["projects", "/admin/projects", "Projects", BarChart3],
  ["billing", "/admin/billing", "Billing", CreditCard],
  ["content", "/admin/content", "Content", FileText],
  ["controls", "/admin/controls", "Controls", Settings2],
] as const;

type AdminShellProps = Readonly<{
  active: (typeof links)[number][0];
  children: React.ReactNode;
}>;

export function AdminShell({ active, children }: AdminShellProps) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Tinlance administration navigation">
        <Link href="/" className="portal-brand"><span className="brand-mark">T</span><span>Tinlance</span></Link>
        <div className="admin-label">ADMINISTRATION</div>
        <nav className="admin-nav">
          {links.map(([key, href, label, Icon]) => <Link key={key} href={href} className={`admin-nav-link ${active === key ? "is-active" : ""}`} aria-current={active === key ? "page" : undefined}><Icon size={17} aria-hidden="true" />{label}</Link>)}
        </nav>
        <div className="admin-sidebar-foot"><span>Privileged workspace</span><PortalAuthControls /></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar"><div className="admin-mobile-brand"><Link href="/" className="brand">Tinlance</Link></div><PortalAuthControls /></header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
