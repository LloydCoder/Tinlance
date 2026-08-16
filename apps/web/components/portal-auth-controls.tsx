"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function PortalAuthControls() {
  if (!clerkEnabled) {
    return <span className="portal-auth-fallback">Preview mode</span>;
  }

  return (
    <>
      <OrganizationSwitcher hidePersonal />
      <UserButton afterSignOutUrl="/" />
    </>
  );
}
