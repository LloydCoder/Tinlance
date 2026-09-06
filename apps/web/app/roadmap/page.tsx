import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Roadmap | Tinlance",
  description: "Public direction for Tinlance products, engineering, and platform capabilities.",
  alternates: { canonical: "/roadmap" },
};

export default function RoadmapPage() {
  return (
    <LegacyInfoPage
      eyebrow="Roadmap"
      title="A public direction, not a promise of dates."
      description="Tinlance is evolving from high-value engineering delivery into a software-enabled AI, FDE, and security platform."
      sections={[
        { title: "Now", body: "The current application prioritizes production AI engineering, AI security, forward-deployed delivery, enterprise automation, assessment-led commercial operations, and a governed customer platform." },
        { title: "Next", body: "The longer-term direction includes deeper customer security/FDE workflows, API and MCP interfaces, agent evaluation and security controls, and reusable delivery playbooks." },
        { title: "How to interpret this page", body: "Roadmap items are directional. They are not commitments to undocumented launch dates, capabilities, certifications, or commercial outcomes." },
      ]}
      cta={{ label: "See current work", href: "/work" }}
    />
  );
}
