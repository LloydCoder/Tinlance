import { SalesEngineer } from "@/components/sales-engineer";

export const metadata = {
  title: "AI Sales Engineer | Tinlance",
  description: "Ask Tinlance's public AI Sales Engineer about AI engineering, FDE, AI security, automation, and technical assessments.",
};

export default function SalesEngineerPage() {
  return (
    <main className="section-v2" style={{ minHeight: "75vh" }}>
      <div className="container" style={{ maxWidth: "980px", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <p className="kicker">TINLANCE / AI SALES ENGINEER</p>
        <h1 style={{ maxWidth: "850px", marginTop: "1rem" }}>Talk through the technical problem before the sales call.</h1>
        <p style={{ maxWidth: "720px", fontSize: "1.15rem", color: "var(--muted)", marginTop: "1.25rem" }}>
          Ask about Tinlance&apos;s public capabilities, technical approach, security work, FDE model, or whether a technical assessment is the right next step. Answers are grounded in approved public evidence.
        </p>
        <div style={{ marginTop: "2.5rem" }}>
          <SalesEngineer />
        </div>
      </div>
    </main>
  );
}
