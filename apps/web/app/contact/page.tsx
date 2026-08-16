import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LeadForm } from "../../components/lead-form";

export const metadata = {
  title: "Contact Tinlance",
  description:
    "Start an engineering conversation with Tinlance about AI engineering, FDE, security, or enterprise automation.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="section-v2 dark-section">
        <div
          className="container"
          style={{ paddingTop: "7rem", paddingBottom: "6rem" }}
        >
          <p className="kicker kicker-dark">TINLANCE / CONTACT</p>
          <h1 style={{ maxWidth: "920px" }}>Tell us what needs to change.</h1>
          <p
            style={{
              maxWidth: "700px",
              fontSize: "1.2rem",
              marginTop: "1.5rem",
            }}
          >
            Share the problem, constraints, and desired outcome. We will use
            that context to determine the right engineering engagement.
          </p>
          <Link
            href="/assessment"
            className="button button-accent"
            style={{ marginTop: "2rem" }}
          >
            Book a technical assessment{" "}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="section-v2">
        <div className="container" style={{ maxWidth: "900px" }}>
          <p className="kicker">START A PROJECT</p>
          <h2
            style={{
              fontSize: "clamp(2.8rem, 5vw, 5rem)",
              lineHeight: ".92",
              letterSpacing: "-.06em",
              maxWidth: "760px",
            }}
          >
            Give us enough context to make the first conversation useful.
          </h2>
          <p
            style={{
              maxWidth: "680px",
              color: "var(--muted)",
              marginTop: "1.25rem",
              marginBottom: "3rem",
            }}
          >
            This is a technical intake, not a generic lead form. We ask for the
            minimum context needed to route the request intelligently.
          </p>
          <LeadForm />
        </div>
      </section>
    </main>
  );
}
