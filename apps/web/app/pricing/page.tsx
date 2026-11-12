import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Pricing",
  description: "Learn how Tinlance scopes AI engineering, security, and FDE engagements through technical assessment and tailored delivery proposals.",
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
        { title: "What affects the scope?", body: "Scope depends on the number of systems and integrations involved, data sensitivity, deployment constraints, reliability requirements, evaluation needs, security controls, and the operational ownership expected after delivery." },
        { title: "What a proposal defines", body: "A proposal should make the work inspectable: problem statement, architecture or approach, deliverables, exclusions, dependencies, milestones, responsibilities, commercial terms, and acceptance criteria. Any ongoing support is described separately." },
      ]}
      cta={{ label: "Start a technical assessment", href: "/assessment" }}
    />
  );
}
