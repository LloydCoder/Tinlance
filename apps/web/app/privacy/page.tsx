import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Privacy | Tinlance",
  description: "How Tinlance handles information submitted through its current website and application.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegacyInfoPage
      eyebrow="Legal"
      title="Privacy"
      description="This page describes the current application-level privacy boundary and is not a substitute for a signed data-processing agreement or legal advice."
      sections={[
        { title: "Information submitted to Tinlance", body: "The current commercial workflow can collect contact and organization information, assessment details, qualification inputs, booking information, proposal decisions, and onboarding information needed to provide the requested service." },
        { title: "How information is used", body: "Information is used to evaluate and respond to requests, qualify opportunities, schedule work, prepare and administer proposals and engagements, provide customer access, maintain audit/security records, and operate the service." },
        { title: "Security and access", body: "Access is controlled by authentication, authorization, tenant boundaries, server-side validation, audit logging, rate limiting, and other application security controls appropriate to the data and workflow." },
        { title: "Retention and requests", body: "Retention depends on the purpose and contractual or legal requirements. For privacy questions or requests concerning information submitted to Tinlance, use the contact route and provide enough context to identify the request." },
      ]}
      cta={{ label: "Contact Tinlance", href: "/contact" }}
    />
  );
}
