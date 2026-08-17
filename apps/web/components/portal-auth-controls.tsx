"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function PortalAuthControls() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  if (isPending) {
    return <span className="portal-auth-fallback">Loading…</span>;
  }

  if (!session) {
    return (
      <Link href="/sign-in" className="portal-auth-fallback">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="portal-auth-fallback" title={session.user.email}>
        {session.user.name}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="portal-auth-fallback"
      >
        Sign out
      </button>
    </div>
  );
}
