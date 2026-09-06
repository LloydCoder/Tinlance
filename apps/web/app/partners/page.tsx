import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Partners | Tinlance",
  description: "Partner with Tinlance on technical delivery, product engineering, and security work.",
  alternates: { canonical: "/partners" },
};

export default function PartnersPage() {
  return (
    <LegacyInfoPage
      eyebrow="Partners"
      title="Extend your delivery capability."
      description="Tinlance can work alongside product companies, agencies, consultancies, and technical teams where specialist engineering capacity is required."
      sections={[
        { title: "Delivery partnerships", body: "Engagements can cover scoped product engineering, forward-deployed work, AI/security implementation, automation, or technical rescue work where the scope and responsibilities are explicit." },
        { title: "Confidentiality", body: "Partner engagements should establish the appropriate NDA, access controls, data boundaries, and delivery responsibilities before sensitive systems or information are shared." },
        { title: "Start with the problem", body: "Describe the customer problem, technical environment, expected outcome, and delivery constraints through the assessment or contact flow." },
      ]}
      cta={{ label: "Start a conversation", href: "/contact" }}
    />
  );
}
