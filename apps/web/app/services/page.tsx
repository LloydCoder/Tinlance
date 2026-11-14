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
      <section className="mt-16 grid gap-6 border-t border-neutral-200 pt-12 md:grid-cols-3">
        <article><h2 className="text-xl font-semibold">Discover the constraint</h2><p className="mt-3 leading-7 text-neutral-600">We start with the workflow, architecture, data boundaries, operating constraints, and the result the team needs. This keeps delivery grounded in the real environment rather than a generic technology package.</p></article>
        <article><h2 className="text-xl font-semibold">Build and integrate</h2><p className="mt-3 leading-7 text-neutral-600">Engineering work can include system design, application development, model and tool integration, automation, testing, security controls, and deployment into the customer's operating environment.</p></article>
        <article><h2 className="text-xl font-semibold">Verify the outcome</h2><p className="mt-3 leading-7 text-neutral-600">Acceptance criteria, evidence, operational ownership, and follow-on support are defined as part of the engagement. Scope and responsibilities are agreed before implementation begins.</p></article>
      </section>
    </main>
  );
}
