type JsonLdProps = { data: Record<string, unknown> | Record<string, unknown>[] };

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json">{json}</script>;
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://tinlance.com/#organization",
  name: "Tinlance",
  url: "https://tinlance.com",
  description:
    "Production-oriented AI engineering, Forward-Deployed Engineering, AI security, and enterprise automation.",
  sameAs: ["https://github.com/LloydCoder/Tinlance"],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://tinlance.com/#website",
  name: "Tinlance",
  url: "https://tinlance.com",
  publisher: { "@id": "https://tinlance.com/#organization" },
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://tinlance.com${item.path}`,
    })),
  };
}
