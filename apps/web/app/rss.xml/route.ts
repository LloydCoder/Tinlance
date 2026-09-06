import { insights } from "../../../lib/content";

const SITE_URL = "https://tinlance.com";

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function GET() {
  const items = insights.map((insight) => `
    <item>
      <title>${escapeXml(insight.title)}</title>
      <link>${SITE_URL}/insights/${insight.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/insights/${insight.slug}</guid>
      <pubDate>${new Date(`${insight.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(insight.excerpt)}</description>
    </item>`).join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Tinlance Insights</title><link>${SITE_URL}/insights</link><description>AI engineering, AI security, FDE, and technical research from Tinlance.</description><language>en</language>${items}</channel></rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
