import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      // Query-string routes must precede their generic path redirects.
      {
        source: "/blog.php",
        has: [
          {
            type: "query",
            key: "slug",
            value: "threatfade-quic-c2-detection",
          },
        ],
        destination: "/research/threatfade-quic-c2-detection",
        permanent: true,
      },
      {
        source: "/blog",
        has: [
          {
            type: "query",
            key: "slug",
            value: "threatfade-quic-c2-detection",
          },
        ],
        destination: "/research/threatfade-quic-c2-detection",
        permanent: true,
      },
      { source: "/services.php", destination: "/services", permanent: true },
      { source: "/work.php", destination: "/work", permanent: true },
      { source: "/about.php", destination: "/about", permanent: true },
      { source: "/blog.php", destination: "/insights", permanent: true },
      { source: "/blog", destination: "/insights", permanent: true },
      { source: "/pricing.php", destination: "/pricing", permanent: true },
      { source: "/faq.php", destination: "/faq", permanent: true },
      { source: "/client/login.php", destination: "/sign-in", permanent: true },
      { source: "/careers.php", destination: "/careers", permanent: true },
      { source: "/roadmap.php", destination: "/roadmap", permanent: true },
      { source: "/privacy.php", destination: "/privacy", permanent: true },
      { source: "/terms.php", destination: "/terms", permanent: true },
      { source: "/unsubscribe.php", destination: "/unsubscribe", permanent: true },
      { source: "/rss.php", destination: "/feed.xml", permanent: true },
      { source: "/changelog.php", destination: "/changelog", permanent: true },
      { source: "/press.php", destination: "/press", permanent: true },
      { source: "/partners.php", destination: "/partners", permanent: true },
      { source: "/sitemap-html.php", destination: "/sitemap.xml", permanent: true },
      { source: "/cookies.php", destination: "/cookies", permanent: true },
      // Historical spelling observed in older migration notes.
      { source: "/cookie-policy.php", destination: "/cookies", permanent: true },
      { source: "/threatfade.php", destination: "/threatfade", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
