"use client";

import { useState } from "react";

export default function ProposalAcceptance({ token, defaultEmail, defaultName, alreadyAccepted }: { token: string; defaultEmail: string; defaultName: string; alreadyAccepted: boolean }) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(alreadyAccepted ? "success" : "idle");
  const [message, setMessage] = useState(alreadyAccepted ? "This proposal has already been accepted." : "");

  async function accept() {
    setStatus("submitting");
    try {
      const response = await fetch("/api/v1/commercial/proposals/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, acceptedByName: name, acceptedByEmail: email, accept: confirmed }) });
      const body = await response.json().catch(() => null) as { error?: string; engagementId?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "acceptance_failed");
      setStatus("success");
      setMessage("Accepted. Tinlance has created the engagement workspace and will follow up with onboarding details.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not record the acceptance.");
    }
  }

  if (status === "success") return <div className="mt-7 rounded-2xl border border-neutral-200 bg-neutral-50 p-5" role="status"><strong>{message}</strong></div>;
  return <div className="mt-7 grid gap-4">
    <label className="grid gap-2 text-sm font-semibold">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4" autoComplete="name" /></label>
    <label className="grid gap-2 text-sm font-semibold">Work email<input value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4" type="email" autoComplete="email" /></label>
    <label className="flex gap-3 text-sm"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />I confirm that I have reviewed this proposal and explicitly accept its stated scope, pricing and acceptance terms.</label>
    <button className="button button-dark w-fit" disabled={status === "submitting" || !confirmed || !name.trim() || !email.trim()} onClick={accept}>{status === "submitting" ? "Recording acceptance…" : "Accept proposal"}</button>
    {status === "error" && <p className="text-sm text-red-700" role="alert">{message}</p>}
  </div>;
}
