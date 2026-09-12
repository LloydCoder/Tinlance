"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/engineering", label: "Engineering" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
  { href: "/security", label: "Security" },
  { href: "/fde-mastery", label: "FDE Mastery" },
  { href: "/assessment", label: "Technical Assessment" },
  { href: "https://github.com/LloydCoder/Tinlance", label: "GitHub", external: true },
];

function isActive(pathname: string, href: string) {
  if (href.startsWith("http")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="mobile-nav">
      <button
        ref={triggerRef}
        type="button"
        className="mobile-menu-trigger"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      {open && (
        <div className="mobile-nav-layer" role="presentation">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close navigation menu"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />
          <div
            ref={panelRef}
            id="mobile-navigation"
            className="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <nav aria-label="Mobile primary navigation">
              {navigation.map((item) => {
                const active = isActive(pathname, item.href);
                return item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className="mobile-nav-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-nav-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span>{item.label}</span>
                    {active && <span aria-hidden="true">Current</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
