"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  Files,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const links = [
  ["overview", "/portal", "Overview", LayoutDashboard],
  ["projects", "/portal/projects", "Projects", FolderKanban],
  ["messages", "/portal/messages", "Messages", MessageSquare],
  ["documents", "/portal/documents", "Documents", Files],
  ["settings", "/portal/settings", "Workspace", Settings],
] as const;

type PortalShellProps = Readonly<{
  active: (typeof links)[number][0];
  children: React.ReactNode;
}>;

export function PortalShell({ active, children }: PortalShellProps) {
  return (
    <div className="portal-shell">
      <aside
        className="portal-sidebar"
        aria-label="Client workspace navigation"
      >
        <Link href="/" className="portal-brand">
          <span className="brand-mark">T</span>
          <span>Tinlance</span>
        </Link>
        <div className="portal-workspace-label">CLIENT WORKSPACE</div>
        <nav className="portal-nav">
          {links.map(([key, href, label, Icon]) => (
            <Link
              key={key}
              href={href}
              className={`portal-nav-link ${active === key ? "is-active" : ""}`}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="portal-sidebar-foot">
          <div className="portal-secure">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Secure workspace</span>
          </div>
          <div className="portal-user">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-topbar">
          <div className="portal-mobile-brand">
            <Link href="/" className="brand">
              Tinlance
            </Link>
          </div>
          <div className="portal-org">
            <OrganizationSwitcher hidePersonal />
          </div>
        </header>
        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
