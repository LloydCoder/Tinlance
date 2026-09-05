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
      { source: "/pricing.php", destination: "/services", permanent: true },
      { source: "/faq.php", destination: "/services", permanent: true },
      { source: "/roadmap.php", destination: "/work", permanent: true },
      { source: "/careers.php", destination: "/contact", permanent: true },
      { source: "/press.php", destination: "/about", permanent: true },
      { source: "/partners.php", destination: "/contact", permanent: true },
      { source: "/threatfade.php", destination: "/threatfade", permanent: true },
      { source: "/changelog.php", destination: "/insights", permanent: true },
      { source: "/privacy.php", destination: "/contact", permanent: true },
      { source: "/terms.php", destination: "/contact", permanent: true },
      {
        source: "/cookie-policy.php",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/unsubscribe.php",
        destination: "/contact",
        permanent: true,
      },
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
