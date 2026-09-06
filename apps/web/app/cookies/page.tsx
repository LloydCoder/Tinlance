import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Cookies | Tinlance",
  description: "Information about cookies and browser storage used by the Tinlance application.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegacyInfoPage
      eyebrow="Legal"
      title="Cookies and browser storage"
      description="Tinlance uses browser storage and cookies only where required for application operation, security, authentication, or explicitly enabled measurement."
      sections={[
        { title: "Essential state", body: "Authentication and application functionality may require secure cookies or browser storage. These mechanisms are part of the application security boundary and are not optional for protected workflows." },
        { title: "Operational measurement", body: "The application may use Vercel-provided operational or performance measurement. This page does not assert any additional advertising or cross-site tracking system that is not present in the current application configuration." },
        { title: "Third-party content", body: "If a future page embeds a third-party service that uses additional storage, the relevant page or service documentation should identify it before the integration is enabled." },
      ]}
      cta={{ label: "Read privacy information", href: "/privacy" }}
    />
  );
}
