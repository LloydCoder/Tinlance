import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tinlance.com"),
  title: {
    default: "Tinlance — AI Engineering & Forward Deployed Engineering",
    template: "%s | Tinlance",
  },
  description:
    "Production-grade AI engineering, security, automation, and Forward Deployed Engineering for ambitious organizations.",
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Tinlance — AI Engineering & Forward Deployed Engineering",
    description:
      "Production-grade AI engineering, security, automation, and Forward Deployed Engineering.",
    type: "website",
    url: "https://tinlance.com",
    siteName: "Tinlance",
    images: [{ url: "/opengraph-image.svg", width: 1200, height: 630, alt: "Tinlance AI engineering and FDE" }],
  },
};

function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <AppShell>{children}</AppShell>
    </ClerkProvider>
  );
}
