import Link from "next/link";

const columns = [
  { title: "Products", links: [["ThreatFade", "https://threatfade.com"], ["FDE Mastery", "https://github.com/LloydCoder/fde-mastery"], ["Products", "/products"]] },
  { title: "Engineering", links: [["Engineering", "/engineering"], ["Security & Trust", "/security"], ["Evidence / Work", "/work"], ["Insights", "/insights"]] },
  { title: "Company", links: [["About", "/about"], ["Services", "/services"], ["Contact", "/contact"], ["Technical Assessment", "/assessment"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"]] },
] as const;

function FooterLink({ label, href }: { label: string; href: string }) {
  const external = href.startsWith("http");
  if (external) return <a href={href} target="_blank" rel="noreferrer">{label} <span aria-hidden="true">↗</span></a>;
  return <Link href={href}>{label}</Link>;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Link className="brand" href="/" aria-label="Tinlance home"><span className="brand-mark" aria-hidden="true">T</span><span>Tinlance</span></Link>
          <p className="footer-copy">AI engineering, security, automation, and forward-deployed systems for teams operating real workflows.</p>
          <div className="footer-open-source" aria-label="Public open-source properties"><span>PUBLIC OPEN SOURCE</span><a href="https://github.com/LloydCoder/tinlance-threatfade" target="_blank" rel="noreferrer">ThreatFade GitHub ↗</a><a href="https://github.com/LloydCoder/fde-mastery" target="_blank" rel="noreferrer">FDE Mastery GitHub ↗</a></div>
        </div>
        <div className="footer-columns">
          {columns.map((column) => <nav className="footer-column" aria-label={`${column.title} footer links`} key={column.title}><h2>{column.title}</h2>{column.links.map(([label, href]) => <FooterLink key={href} label={label} href={href} />)}</nav>)}
        </div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Tinlance Limited.</span><span>Built for production. Designed for trust.</span></div>
    </footer>
  );
}
