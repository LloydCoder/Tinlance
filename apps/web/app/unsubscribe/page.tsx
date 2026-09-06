import { LegacyInfoPage } from "../../components/legacy-info-page";

export const metadata = {
  title: "Unsubscribe | Tinlance",
  description: "Manage or request removal from Tinlance marketing communications.",
  alternates: { canonical: "/unsubscribe" },
};

export default function UnsubscribePage() {
  return (
    <LegacyInfoPage
      eyebrow="Communications"
      title="Unsubscribe"
      description="If you received a Tinlance marketing communication and no longer want it, use the unsubscribe control included in that message or contact Tinlance to request removal."
      sections={[
        { title: "What to include", body: "Provide the email address that received the communication and, where possible, the subject or campaign name so the request can be handled accurately." },
        { title: "Service communications", body: "Transactional messages needed to operate an assessment, booking, proposal, engagement, account, or security process may continue because they are not marketing communications." },
      ]}
      cta={{ label: "Contact Tinlance", href: "/contact" }}
    />
  );
}
