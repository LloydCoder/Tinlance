import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbSchema } from "../../components/json-ld";
import { services } from "../../lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "AI engineering, AI security, Forward-Deployed Engineering, and enterprise automation services from Tinlance.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} />
      <header className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Services</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-950">Engineering that moves from requirement to production.</h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600">Tinlance combines AI engineering, security, automation, and forward-deployed delivery for organizations solving complex technical problems.</p>
      </header>
      <section className="mt-14 grid gap-6 md:grid-cols-2" aria-label="Tinlance services">
        {services.map((service) => (
          <article key={service.slug} className="rounded-2xl border border-neutral-200 p-7">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-neutral-500">{service.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">{service.name}</h2>
            <p className="mt-4 max-w-xl leading-7 text-neutral-600">{service.description}</p>
            <Link className="mt-6 inline-flex font-medium text-neutral-950 underline underline-offset-4" href={`/services/${service.slug}`}>
              Explore service
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
