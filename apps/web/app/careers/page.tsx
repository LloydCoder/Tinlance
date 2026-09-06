import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Careers | Tinlance",
  description: "Career and engineering opportunities at Tinlance.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <LegacyInfoPage
      eyebrow="Careers"
      title="Build difficult systems with us."
      description="Tinlance works across AI engineering, security engineering, forward-deployed engineering, and automation."
      sections={[
        { title: "Open roles", body: "No specific open role is asserted here unless it is actively published by Tinlance. This avoids turning the legacy careers route into an invented vacancy list." },
        { title: "What we value", body: "Strong engineering fundamentals, security discipline, ownership, clear communication, and the ability to move from ambiguous requirements to reliable software." },
        { title: "Get in touch", body: "If your background is relevant to the work we build, use the contact route to introduce yourself and describe the problems you are equipped to solve." },
      ]}
      cta={{ label: "Contact Tinlance", href: "/contact" }}
    />
  );
}
