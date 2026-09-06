import type { Metadata } from "next";
import { JsonLd, organizationSchema, websiteSchema } from "../components/json-ld";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tinlance.com"),
  title: {
    default: "Tinlance — AI Engineering & Forward-Deployed Engineering",
    template: "%s | Tinlance",
  },
  description:
    "Production-oriented AI engineering, AI security, Forward-Deployed Engineering, and enterprise automation for organizations building and securing intelligent systems.",
  applicationName: "Tinlance",
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Tinlance — AI Engineering & Forward-Deployed Engineering",
    description:
      "Production-oriented AI engineering, AI security, Forward-Deployed Engineering, and enterprise automation.",
    type: "website",
    url: "https://tinlance.com",
    siteName: "Tinlance",
    images: [
      {
        url: "/opengraph-image.svg",
        width: 1200,
        height: 630,
        alt: "Tinlance AI engineering and Forward-Deployed Engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tinlance — AI Engineering & Forward-Deployed Engineering",
    description:
      "Production-oriented AI engineering, AI security, Forward-Deployed Engineering, and enterprise automation.",
    images: ["/opengraph-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
