import Link from "next/link";
import { MobileNav } from "./mobile-nav";

const navigation = [
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/engineering", label: "Engineering" },
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
          <Link href="/security" className="nav-link">Security</Link>
        </nav>
        <div className="header-actions">
          <Link className="button button-small button-dark header-assessment" href="/assessment">
            Technical assessment
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
