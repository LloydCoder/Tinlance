import Link from "next/link";

const resources = [
  {
    title: "AI Agent Security Field Guide",
    description: "A practical framework for identity, tools, data boundaries, evaluation, and auditability.",
    type: "Guide",
    action: "Request the guide",
  },
  {
    title: "Enterprise AI Readiness Assessment",
    description: "A structured starting point for evaluating architecture, security, operations, and deployment readiness.",
    type: "Assessment",
    action: "Start an assessment",
  },
  {
    title: "Tinlance Intelligence",
    description: "Research and engineering insights for teams building production AI and automation systems.",
    type: "Newsletter",
    action: "Join the intelligence list",
  },
];

export const metadata = {
  title: "Resources | Tinlance",
  description: "Guides, assessments, and engineering intelligence from Tinlance.",
};

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Resources</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-950">Useful intelligence, built to move decisions forward.</h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600">Free and premium resources that turn Tinlance engineering experience into practical frameworks, assessments, and research.</p>
      </header>
      <section className="mt-14 grid gap-6 md:grid-cols-3" aria-label="Tinlance resources">
        {resources.map((resource) => (
          <article key={resource.title} className="flex flex-col rounded-2xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">{resource.type}</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-950">{resource.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600">{resource.description}</p>
            <Link href="/contact" className="mt-6 inline-flex font-medium text-neutral-950 underline underline-offset-4">{resource.action} →</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
