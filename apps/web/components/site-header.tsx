import Link from "next/link";

const navigation = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Tinlance home">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>Tinlance</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          className="button button-small button-dark"
          href="/assessment"
        >
          Technical assessment
        </Link>
      </div>
    </header>
  );
}
