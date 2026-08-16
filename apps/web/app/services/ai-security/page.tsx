import type { Metadata } from "next";
import { SectionHeading } from "../../../components/section-heading";

export const metadata: Metadata = {
  title: "AI Security",
  description: "Threat modeling and security engineering for AI-enabled applications and agents.",
};

export default function AISecurityPage() {
  return <section className="section"><div className="container"><SectionHeading eyebrow="AI Security" title="Secure AI systems before they become production risk." description="Threat modeling, agent controls, data protection, evaluation, and security engineering for systems that use models and tools." /></div></section>;
}
