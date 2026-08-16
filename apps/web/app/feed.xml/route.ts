import { insights } from "../../lib/content";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function GET() {
  const items = insights.map((insight) => `
    <item>
      <title>${escapeXml(insight.title)}</title>
      <link>https://tinlance.com/insights/${insight.slug}</link>
      <guid isPermaLink="true">https://tinlance.com/insights/${insight.slug}</guid>
      <description>${escapeXml(insight.excerpt)}</description>
      <pubDate>${new Date(`${insight.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
      <category>${escapeXml(insight.category)}</category>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tinlance Insights</title>
    <link>https://tinlance.com/insights</link>
    <description>Engineering intelligence on AI, security, FDE, and enterprise automation.</description>
    <language>en</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
