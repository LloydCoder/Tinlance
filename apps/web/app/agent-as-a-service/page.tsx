import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  ShieldCheck,
  Workflow,
  Clapperboard,
  Radar,
  HeartPulse,
  GitPullRequestArrow,
  FileCheck2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { socialImageUrl, socialImages } from "../../lib/metadata";
import offerCatalog from "../../lib/platform/aaas-offers.generated.json";

export const metadata: Metadata = {
  title: "Agent-as-a-Service",
  description: "Assessment-led, governed AI agent services from Tinlance. Clear capability boundaries, tenant-scoped entitlements, evidence and human approval.",
  alternates: { canonical: "/agent-as-a-service" },
  openGraph: {
    title: "Agent-as-a-Service | Tinlance",
    description: "Governed agent infrastructure and assessment-led AI agent services with explicit authority and evidence boundaries.",
    url: "/agent-as-a-service",
    type: "website",
    images: socialImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent-as-a-Service | Tinlance",
    description: "Assessment-led AI agent services with explicit authority, entitlement and evidence boundaries.",
    images: [socialImageUrl],
  },
};

const systemLabels: Record<string, string> = {
  "agent-platform": "Agent Platform",
  "agent-platform-sdk": "Agent Platform SDK",
  "agent-os": "Agent OS",
  "agent-developer": "Agent Developer",
  "world-intelligence": "World Intelligence",
  tads: "TADS",
  sdea: "SDEA",
  reconos: "ReconOS",
  fadereach: "FadeReach",
  fdse: "FDSE",
  "economic-attribution": "Economic Attribution",
  hezcast: "HezCast",
  threatfade: "ThreatFade Engine",
  "threatfade-web": "ThreatFade Web",
  bugflow: "BugFlow",
  fas: "FAS",
  "fdse-toolkit": "FDSE Toolkit",
  hezqara: "Hezqara",
  "fde-mastery": "FDE Mastery",
  fde: "FDE",
  transformation: "Transformation",
};

const categoryIcons: Record<string, LucideIcon> = {
  "agent-platform": ShieldCheck,
  acquisition: Workflow,
  "content-and-acquisition": Clapperboard,
  cybersecurity: Radar,
  "healthcare-operations": HeartPulse,
  "engineering-delivery": GitPullRequestArrow,
  assurance: FileCheck2,
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Tinlance Agent-as-a-Service catalog",
  itemListElement: offerCatalog.offers.map((offer, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: offer.name,
    description: offer.summary,
    url: "https://tinlance.com/agent-as-a-service",
  })),
};

export default function AgentAsAServicePage() {
  return (
    <main>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Agent-as-a-Service", path: "/agent-as-a-service" },
          ]),
          itemListSchema,
        ]}
      />
      <section className="section-v2 dark-section">
        <div className="container" style={{ paddingTop: "7rem", paddingBottom: "6rem" }}>
          <p className="kicker kicker-dark">TINLANCE / AGENT-AS-A-SERVICE</p>
          <h1 style={{ maxWidth: "980px" }}>Agents built for governed work, not unchecked autonomy.</h1>
          <p style={{ maxWidth: "780px", fontSize: "1.2rem", marginTop: "1.5rem" }}>
            Explore assessment-led agent services across acquisition, content, security, healthcare operations and engineering delivery. Every offer has explicit capability boundaries, tenant-scoped entitlements and evidence requirements.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "2rem" }}>
            <Link className="button button-accent" href="/assessment">
              Request a technical assessment <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link className="text-link" href="/products">
              Explore Tinlance products <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <p style={{ maxWidth: "760px", marginTop: "1.5rem", color: "rgba(255,255,255,.72)" }}>
            Availability and pricing are confirmed after technical assessment. No public price or production-readiness claim is implied by catalog inclusion.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2 compact">
            <div>
              <p className="kicker">THE CATALOG</p>
              <h2>Choose the work. <span>Govern the execution.</span></h2>
            </div>
            <p>
              These offers bind to registered Tinlance capabilities. They do not create new execution authority, bypass consent or policy, or turn a test result into customer-outcome evidence.
            </p>
          </div>
          <div className="capability-grid">
            {offerCatalog.offers.map((offer) => {
              const Icon = categoryIcons[offer.category] ?? ShieldCheck;
              return (
                <article className="capability-card" key={offer.id} style={{ minHeight: "470px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    <span className="capability-index">{offer.category.replaceAll("-", " ").toUpperCase()}</span>
                    <span className="capability-index">ASSESSMENT REQUIRED</span>
                  </div>
                  <div className="capability-card-body">
                    <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                      <Icon size={22} aria-hidden="true" />
                      <h2>{offer.name}</h2>
                    </div>
                    <p style={{ marginTop: "1rem" }}><strong>The problem:</strong> {offer.buyer_problem}</p>
                    <p style={{ marginTop: "1rem" }}>{offer.summary}</p>
                    <p style={{ marginTop: "1.25rem" }}><strong>Systems in scope</strong></p>
                    <ul style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", listStyle: "none", padding: 0, marginTop: ".5rem" }}>
                      {offer.runtime_systems.map((system) => (
                        <li className="capability-index" key={system}>{systemLabels[system] ?? system}</li>
                      ))}
                    </ul>
                    <p style={{ marginTop: "1.25rem" }}><strong>Activation:</strong> Technical assessment, scope and jurisdiction review, tenant entitlement, usage budget, then approved provisioning.</p>
                    <p style={{ marginTop: "1rem" }}><strong>Pricing:</strong> Quote after assessment.</p>
                    <p style={{ marginTop: "1rem" }}><strong>Boundary:</strong> {offer.limitations[0]}</p>
                    <Link className="text-link" href={`/assessment?capability=${encodeURIComponent(offer.name)}`} style={{ display: "inline-flex", marginTop: "1.5rem" }}>
                      Request an assessment <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-v2">
        <div className="container">
          <div className="section-intro-v2 compact">
            <div>
              <p className="kicker">GOVERNANCE BY DEFAULT</p>
              <h2>Authority stays <span>explicit.</span></h2>
            </div>
            <p>Agent Platform remains the generic execution authority. Domain systems own their domain semantics; commercial entitlements determine what a tenant may use, not what the agent may do without authorization.</p>
          </div>
          <div className="capability-grid">
            <article className="capability-card">
              <div className="capability-card-body">
                <h2>Scoped access</h2>
                <p>Tenant identity, region policy, usage budgets and capability entitlements are checked before activation.</p>
              </div>
            </article>
            <article className="capability-card">
              <div className="capability-card-body">
                <h2>Human approval</h2>
                <p>External publishing and other consequential actions require explicit policy and approval gates.</p>
              </div>
            </article>
            <article className="capability-card">
              <div className="capability-card-body">
                <h2>Evidence, not promises</h2>
                <p>Delivery, conversion, security and ROI claims require source evidence. Catalog inclusion is not proof of customer outcomes.</p>
              </div>
            </article>
          </div>
          <p style={{ marginTop: "2rem" }}>
            Need a tailored agent or vertical workforce? <Link className="text-link" href="/assessment">Start with a technical assessment <ArrowUpRight size={16} aria-hidden="true" /></Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
