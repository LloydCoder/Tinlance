import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">T</span>
            <span>Tinlance</span>
          </Link>
          <p className="footer-copy">
            AI engineering, security, automation, and forward-deployed systems for ambitious teams.
          </p>
        </div>
        <div className="footer-links" aria-label="Footer navigation">
          <Link href="/services">Services</Link>
          <Link href="/work">Work</Link>
          <Link href="/insights">Insights</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Tinlance Limited.</span>
        <span>Built for production. Designed for trust.</span>
      </div>
    </footer>
  );
}
