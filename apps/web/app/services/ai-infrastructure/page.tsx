import type { Metadata } from "next";
import { SectionHeading } from "../../../components/section-heading";

export const metadata: Metadata = {
  title: "AI Infrastructure",
  description: "Production foundations for reliable AI systems, RAG, evaluation, deployment, and telemetry.",
};

export default function AIInfrastructurePage() {
  return <section className="section"><div className="container"><SectionHeading eyebrow="AI Infrastructure" title="Build an AI foundation that can be operated." description="Architecture for model gateways, RAG, evaluation, observability, deployment, and the platform boundaries required for reliable AI systems." /></div></section>;
}
