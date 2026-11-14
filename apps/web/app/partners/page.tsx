import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Partners",
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
        { title: "Who this is for", body: "Potential partners include software and product agencies, cloud and platform consultancies, MSPs and MSSPs, AI implementation firms, venture studios, and specialist technology providers that need senior engineering capacity for a defined customer problem." },
        { title: "How delivery is coordinated", body: "The parties agree who owns discovery, customer communication, architecture decisions, implementation, access, acceptance, and ongoing support. Customer data and credentials are shared only through approved channels and with least-privilege access." },
        { title: "Start with the problem", body: "Describe the customer problem, technical environment, expected outcome, and delivery constraints through the assessment or contact flow." },
      ]}
      cta={{ label: "Start a conversation", href: "/contact" }}
    />
  );
}
