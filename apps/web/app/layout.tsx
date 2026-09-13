import type { Metadata } from "next";
import { JsonLd, organizationSchema, websiteSchema } from "../components/json-ld";
import { GrowthTracker } from "../components/growth-tracker";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { getSiteUrl, isVercelPreview } from "../lib/site";
import "../components/architecture-map.css";
import "../components/mobile-nav.css";
import "./globals.css";

const siteUrl = getSiteUrl();
const previewRobots: Metadata["robots"] = isVercelPreview()
  ? { index: false, follow: false }
  : { index: true, follow: true };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Tinlance — AI Engineering & Forward-Deployed Engineering", template: "%s | Tinlance" },
  description: "Production-oriented AI engineering, AI security, Forward-Deployed Engineering, and enterprise automation for organizations building and securing intelligent systems.",
  applicationName: "Tinlance",
  alternates: { canonical: "/" },
  robots: previewRobots,
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Tinlance — AI Engineering & Forward-Deployed Engineering",
    description: "Production-oriented AI engineering, AI security, Forward-Deployed Engineering, and enterprise automation.",
    type: "website",
    url: siteUrl,
    siteName: "Tinlance",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Tinlance — AI Engineering and Forward-Deployed Engineering" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tinlance — AI Engineering & Forward-Deployed Engineering",
    description: "Production-oriented AI engineering, AI security, Forward-Deployed Engineering, and enterprise automation.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <GrowthTracker />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
