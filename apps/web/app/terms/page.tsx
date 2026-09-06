import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Terms | Tinlance",
  description: "Current website and service terms for Tinlance.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegacyInfoPage
      eyebrow="Legal"
      title="Terms"
      description="These website-level terms describe the basic boundaries for using Tinlance public services. Specific commercial engagements are governed by their executed agreement and proposal."
      sections={[
        { title: "Use of the site", body: "Use the site lawfully and do not attempt to bypass authentication, authorization, security controls, rate limits, or other technical safeguards." },
        { title: "Assessments and proposals", body: "Submitting an assessment or receiving a proposal does not by itself create a delivery contract. Commercial work begins only after the applicable proposal or agreement is explicitly accepted and the engagement is established." },
        { title: "Historical technical evidence", body: "Research and proof material may describe scoped experiments or historical engineering results. Such material must not be interpreted as an unconditional warranty or universal production guarantee unless the current agreement expressly says so." },
        { title: "Engagement terms", body: "Scope, fees, milestones, acceptance criteria, confidentiality, security requirements, intellectual property, warranties, liability, and governing law are controlled by the applicable executed agreement rather than this summary page." },
      ]}
      cta={{ label: "Start a technical assessment", href: "/assessment" }}
    />
  );
}
