import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Assessment",
  description: "Submit the technical, workflow, business and security context Tinlance needs to determine fit and the right engineering next step.",
  alternates: { canonical: "/assessment" },
  openGraph: {
    title: "Technical Assessment | Tinlance",
    description: "Provide the context Tinlance needs to assess an AI engineering or FDE opportunity.",
    url: "/assessment",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Technical Assessment | Tinlance",
    description: "Provide the context Tinlance needs to assess an AI engineering or FDE opportunity.",
  },
};

export default function AssessmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
