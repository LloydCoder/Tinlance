import { ArrowUpRight, MessageSquare } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "../../../components/portal-shell";
import { requireOrganization } from "../../../lib/tenant";
import { auth } from "../../../lib/auth";
import { db } from "../../../lib/db";

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackURL=/portal/messages");

  const organization = await requireOrganization(
    session.session.activeOrganizationId,
    session.user.id,
  );
  const messages = organization
    ? await db.message.findMany({
        where: { organizationId: organization.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <PortalShell active="messages">
      <div className="portal-page-head">
        <div>
          <p className="kicker">COMMUNICATIONS</p>
          <h1>Project messages.</h1>
          <p>
            Keep delivery questions, decisions, and updates attached to the
            work.
          </p>
        </div>
      </div>
      <section className="portal-message-card">
        <div className="portal-message-icon">
          <MessageSquare size={20} aria-hidden="true" />
        </div>
        <div className="w-full">
          <span className="portal-project-status">
            <span aria-hidden="true" />
            {messages.length === 0
              ? "No messages yet"
              : `${messages.length} messages`}
          </span>
          <h2>
            {messages.length === 0
              ? "Communication center ready."
              : "Latest project communication."}
          </h2>
          {messages.length === 0 ? (
            <p>
              Messages will appear here when a Tinlance delivery team member
              posts an update for this organization.
            </p>
          ) : (
            <div className="mt-6 grid gap-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                >
                  <p className="text-sm text-neutral-500">
                    {message.createdAt.toLocaleString()}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-neutral-800">
                    {message.body}
                  </p>
                </article>
              ))}
            </div>
          )}
          <span className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-500">
            Tenant-scoped workspace{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </div>
      </section>
    </PortalShell>
  );
}
