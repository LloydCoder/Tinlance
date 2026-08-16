import { redirect } from "next/navigation";
import { getAuthorizationContext } from "../../lib/auth/authorization";

export default async function AdminPage() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) redirect("/sign-in");
  if (!context.isPrivileged) redirect("/portal");

  return (
    <section className="mx-auto min-h-[70vh] max-w-6xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Administration</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Tinlance control center</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Privileged operations will be introduced here behind explicit role-based authorization.
      </p>
    </section>
  );
}
