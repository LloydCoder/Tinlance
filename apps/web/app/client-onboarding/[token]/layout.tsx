import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client onboarding",
  robots: { index: false, follow: false },
};

export default function ClientOnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
