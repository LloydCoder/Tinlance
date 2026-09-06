import { NextResponse } from "next/server";
import { researchItems } from "../../lib/authority";
import { insights, services } from "../../lib/content";

export function GET() {
  const lines = [
    "# Tinlance",
    "",
    "> Optional machine-readable orientation aid. This file is not a ranking mechanism and is not a substitute for crawlable HTML, canonical URLs, sitemap, or robots.txt.",
    "",
    "## Entity",
    "- Name: Tinlance",
    "- Website: https://tinlance.com",
    "- Positioning: Production-oriented AI engineering, Forward-Deployed Engineering, AI security, and enterprise automation.",
    "",
    "## Services",
    ...services.map((service) => `- ${service.name}: https://tinlance.com/services/${service.slug}`),
    "",
    "## Research",
    ...researchItems.map((item) => `- ${item.title}: https://tinlance.com${item.canonicalPath}`),
    "",
    "## Insights",
    ...insights.map((item) => `- ${item.title}: https://tinlance.com/insights/${item.slug}`),
    "",
    "## Engagement",
    "- Technical assessment: https://tinlance.com/assessment",
    "- Contact: https://tinlance.com/contact",
    "",
    "## Authority boundary",
    "- FDE Mastery remains the methodology and execution-platform authority for FDE capabilities.",
    "- Tinlance is the public commercial and customer-facing authority layer.",
    "- Historical ThreatFade experiment results are explicitly scoped as historical MVP evidence, not universal production guarantees.",
  ];

  return new NextResponse(`${lines.join("\\n")}\\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
