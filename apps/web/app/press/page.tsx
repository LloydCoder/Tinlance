import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Press | Tinlance",
  description: "Company background and media information for Tinlance.",
  alternates: { canonical: "/press" },
};

export default function PressPage() {
  return (
    <LegacyInfoPage
      eyebrow="Press"
      title="Tinlance company information"
      description="Tinlance is an engineering company focused on production AI, security, forward-deployed engineering, and automation."
      sections={[
        { title: "Company summary", body: "Tinlance builds and operates software for difficult technical problems, with an emphasis on production delivery, security, and customer-specific engineering." },
        { title: "Evidence", body: "Public technical evidence includes the ThreatFade research material and independently inspectable open-source security contributions. Historical results are presented with their experimental scope rather than as universal production guarantees." },
        { title: "Media requests", body: "For current company information, interview requests, or technical context, contact Tinlance through the main contact route." },
      ]}
      cta={{ label: "Contact Tinlance", href: "/contact" }}
    />
  );
}
