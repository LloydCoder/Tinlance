import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Pricing | Tinlance",
  description: "Assessment-led pricing and scoped engagement models from Tinlance.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <LegacyInfoPage
      eyebrow="Commercial"
      title="Pricing follows the problem, not a made-up package."
      description="Tinlance scopes work after a technical assessment so the proposal reflects the systems, security requirements, delivery model, and outcomes actually involved."
      sections={[
        { title: "Technical assessment", body: "The assessment establishes the problem, environment, constraints, stakeholders, and delivery requirements before a proposal is issued." },
        { title: "Scoped delivery", body: "Projects are priced against an agreed scope, milestones, dependencies, and acceptance criteria. Recurring FDE or engineering support is separately scoped where appropriate." },
        { title: "Why there is no universal rate card", body: "The legacy site contained commercial information, but the currently verifiable application does not establish a single public rate card. This page therefore avoids inventing historical or current prices." },
      ]}
      cta={{ label: "Start a technical assessment", href: "/assessment" }}
    />
  );
}
