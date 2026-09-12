import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Assessment",
  description: "Start a Tinlance technical assessment for AI engineering, FDE, security, automation, and production AI systems work.",
  alternates: { canonical: "/assessment" },
  openGraph: {
    title: "Technical Assessment | Tinlance",
    description: "Describe the workflow, architecture, constraints and desired outcome so Tinlance can determine technical fit.",
    url: "/assessment",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Technical Assessment | Tinlance",
    description: "Start a technical assessment with Tinlance.",
  },
};

export default function AssessmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
