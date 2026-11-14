import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "FAQ",
  description: "Answers about Tinlance assessments, delivery, security, and engagements.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <LegacyInfoPage
      eyebrow="FAQ"
      title="How Tinlance engagements work"
      description="A concise guide to the current assessment-led delivery model."
      sections={[
        { title: "What happens first?", body: "A technical assessment captures the problem, current environment, constraints, desired outcome, urgency, and relevant stakeholders. It is the primary commercial entry point." },
        { title: "Do you build production systems?", body: "Tinlance is positioned around production AI engineering, security engineering, forward-deployed engineering, and enterprise automation. Scope and delivery model are agreed before work begins." },
        { title: "How is security handled?", body: "Security requirements are considered during discovery and architecture. Consequential actions remain subject to explicit human approval and server-side controls in the platform." },
        { title: "How is pricing decided?", body: "Pricing is scoped from the assessed problem and agreed delivery requirements rather than presented as an unsupported universal price list." },
        { title: "Can you work with an existing engineering team?", body: "Yes. The delivery model can be collaborative or embedded, depending on the problem, access requirements, team structure, and agreed responsibilities. The assessment helps establish the right boundary." },
        { title: "What information should we share first?", body: "Start with the workflow, system context, constraints, desired outcome, and urgency. Do not submit credentials, secrets, payment data, or sensitive customer records through the public assessment form." },
      ]}
      cta={{ label: "Start a technical assessment", href: "/assessment" }}
    />
  );
}
