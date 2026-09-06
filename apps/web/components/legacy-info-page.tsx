import Link from "next/link";

type LegacyInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{ title: string; body: string }>;
  cta?: { label: string; href: string };
};

export function LegacyInfoPage({
  eyebrow,
  title,
  description,
  sections,
  cta,
}: LegacyInfoPageProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">
          {title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600">{description}</p>
      </header>
      <div className="mt-12 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-neutral-950">{section.title}</h2>
            <p className="mt-3 leading-7 text-neutral-600">{section.body}</p>
          </section>
        ))}
      </div>
      {cta ? (
        <Link
          className="mt-12 inline-flex rounded-full bg-neutral-950 px-5 py-3 font-medium text-white"
          href={cta.href}
        >
          {cta.label}
        </Link>
      ) : null}
    </main>
  );
}
