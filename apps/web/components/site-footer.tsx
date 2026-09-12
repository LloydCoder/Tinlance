import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/" aria-label="Tinlance home">
            <span className="brand-mark" aria-hidden="true">T</span>
            <span>Tinlance</span>
          </Link>
          <p className="footer-copy">
            AI engineering, security, automation, and forward-deployed systems for teams operating real workflows.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/services">Services</Link>
          <Link href="/products">Products</Link>
          <Link href="/engineering">Engineering</Link>
          <Link href="/security">Security</Link>
          <Link href="/fde-mastery">FDE Mastery</Link>
          <Link href="/insights">Insights</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/assessment">Technical Assessment</Link>
          <a href="https://threatfade.com" target="_blank" rel="noreferrer">ThreatFade ↗</a>
          <a href="https://github.com/LloydCoder/Tinlance" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Tinlance Limited.</span>
        <span>Built for production. Designed for trust.</span>
      </div>
    </footer>
  );
}
