import type { Metadata } from "next";
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
