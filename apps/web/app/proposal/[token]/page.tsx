import { notFound } from "next/navigation";
import { ProposalStatus } from "@prisma/client";
import { hashProposalToken } from "@/lib/commercial/security";
import { db } from "@/lib/db";
import ProposalAcceptance from "./proposal-acceptance";

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 32 || token.length > 128) notFound();
  const proposal = await db.proposal.findUnique({ where: { publicTokenHash: hashProposalToken(token) }, include: { lead: true, versions: { orderBy: { version: "desc" }, take: 1 } } });
  if (!proposal) notFound();
  if (proposal.expiresAt && proposal.expiresAt <= new Date()) return <main className="section-v2"><div className="container" style={{ paddingTop: "8rem", paddingBottom: "8rem", maxWidth: "900px" }}><p className="kicker">PROPOSAL EXPIRED</p><h1>This proposal is no longer available.</h1><p style={{ marginTop: "1rem" }}>Please contact Tinlance if you need an updated proposal.</p></div></main>;
  if (proposal.status === ProposalStatus.SENT) await db.$transaction(async (tx) => { await tx.proposal.update({ where: { id: proposal.id }, data: { status: ProposalStatus.VIEWED, viewedAt: new Date() } }); await tx.auditEvent.create({ data: { organizationId: proposal.organizationId, action: "proposal.viewed", resourceType: "proposal", resourceId: proposal.id, metadata: { version: proposal.currentVersion } } }); });
  const version = proposal.versions[0];
  if (!version) notFound();
  const pricing = version.pricing as { currency?: string; totalMinor?: number; items?: { name: string; amountMinor: number }[] };
  return <main className="section-v2"><div className="container" style={{ paddingTop: "6rem", paddingBottom: "7rem", maxWidth: "960px" }}>
    <p className="kicker">TINLANCE / PROPOSAL {proposal.proposalNumber}</p>
    <h1>{proposal.title}</h1>
    <p style={{ marginTop: "1rem", maxWidth: "720px" }}>A scoped engineering proposal for {proposal.lead.organizationName}. Review the delivery scope, commercial terms and acceptance conditions below.</p>
    <div className="grid gap-6" style={{ marginTop: "3rem" }}>
      <section className="rounded-[24px] border border-neutral-200 bg-white p-7"><p className="kicker">EXECUTIVE SUMMARY</p><p className="mt-3 whitespace-pre-wrap">{version.executiveSummary}</p></section>
      <section className="rounded-[24px] border border-neutral-200 bg-white p-7"><p className="kicker">PROBLEM</p><p className="mt-3 whitespace-pre-wrap">{version.problemDefinition}</p><p className="kicker" style={{ marginTop: "2rem" }}>PROPOSED SOLUTION</p><p className="mt-3 whitespace-pre-wrap">{version.proposedSolution}</p></section>
      <section className="rounded-[24px] border border-neutral-200 bg-white p-7"><p className="kicker">SCOPE & DELIVERABLES</p><ul className="mt-4 list-disc pl-5">{(version.scope as string[]).map((item) => <li key={`scope-${item}`}>{item}</li>)}{(version.deliverables as string[]).map((item) => <li key={`deliverable-${item}`}>{item}</li>)}</ul></section>
      <section className="rounded-[24px] border border-neutral-200 bg-white p-7"><p className="kicker">COMMERCIALS</p><p className="mt-3 text-3xl font-semibold">{pricing.currency ?? "USD"} {((pricing.totalMinor ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><ul className="mt-4 space-y-2">{(pricing.items ?? []).map((item) => <li className="flex justify-between gap-4 border-b border-neutral-100 py-2" key={item.name}><span>{item.name}</span><span>{pricing.currency ?? "USD"} {(item.amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></li>)}</ul></section>
      <section className="rounded-[24px] border border-neutral-200 bg-white p-7"><p className="kicker">ACCEPTANCE</p><p className="mt-3 whitespace-pre-wrap">{version.acceptanceTerms}</p><ProposalAcceptance token={token} defaultEmail={proposal.lead.email} defaultName={proposal.lead.contactName} alreadyAccepted={proposal.status === ProposalStatus.ACCEPTED} /></section>
    </div>
  </div></main>;
}
