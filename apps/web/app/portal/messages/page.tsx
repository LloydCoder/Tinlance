import { ArrowUpRight, MessageSquare } from "lucide-react";
import { PortalShell } from "../../../components/portal-shell";

export default function MessagesPage() {
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
        <div>
          <span className="portal-project-status">
            <span aria-hidden="true" />
            No urgent messages
          </span>
          <h2>Communication center ready.</h2>
          <p>
            Live project threads will appear here once your workspace is
            connected to Tinlance delivery operations.
          </p>
          <button type="button" className="button button-dark">
            Start a conversation <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </PortalShell>
  );
}
