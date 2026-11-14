import type { Metadata } from "next";
import { SalesEngineer } from "@/components/sales-engineer";
import { socialImageUrl, socialImages } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "AI Sales Engineer",
  description: "Ask Tinlance's public AI Sales Engineer about AI engineering, FDE, AI security, automation, and technical assessments.",
  alternates: { canonical: "/sales-engineer" },
  openGraph: { title: "AI Sales Engineer | Tinlance", description: "Explore Tinlance's public technical capabilities and determine whether a technical assessment is the right next step.", url: "/sales-engineer", type: "website", images: socialImages },
  twitter: { card: "summary_large_image", title: "AI Sales Engineer | Tinlance", description: "Explore Tinlance's public technical capabilities and determine whether a technical assessment is the right next step.", images: [socialImageUrl] },
};

export default function SalesEngineerPage() {
  return (
    <main className="section-v2" style={{ minHeight: "75vh" }}>
      <div className="container" style={{ maxWidth: "980px", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <p className="kicker">TINLANCE / AI SALES ENGINEER</p>
        <h1 style={{ maxWidth: "850px", marginTop: "1rem" }}>Talk through the technical problem before the sales call.</h1>
        <p style={{ maxWidth: "720px", fontSize: "1.15rem", color: "var(--muted)", marginTop: "1.25rem" }}>Ask about Tinlance&apos;s public capabilities, technical approach, security work, FDE model, or whether a technical assessment is the right next step. Answers are grounded in approved public evidence.</p>
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-neutral-200 p-5"><h2 className="font-semibold">Understand capabilities</h2><p className="mt-2 text-sm leading-6 text-neutral-600">Explore AI engineering, forward-deployed delivery, AI security, and enterprise automation, including the kinds of problems each service is designed to address.</p></article>
          <article className="rounded-2xl border border-neutral-200 p-5"><h2 className="font-semibold">Prepare for discovery</h2><p className="mt-2 text-sm leading-6 text-neutral-600">Use the conversation to organize the workflow, system context, constraints, and outcomes that matter before starting a technical assessment.</p></article>
          <article className="rounded-2xl border border-neutral-200 p-5"><h2 className="font-semibold">Evidence boundary</h2><p className="mt-2 text-sm leading-6 text-neutral-600">The assistant is limited to approved public information. It cannot inspect private customer environments, authorize work, make binding commitments, or replace engineering review.</p></article>
        </section>
        <div style={{ marginTop: "2.5rem" }}><SalesEngineer /></div>
      </div>
    </main>
  );
}
