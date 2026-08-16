import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PortalPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const name = user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "Client";

  return (
    <section className="mx-auto min-h-[70vh] max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Client portal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Welcome back, {name}.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your secure Tinlance workspace is ready. Project delivery, assessments, billing, and communications will live here.
        </p>
      </div>
    </section>
  );
}
