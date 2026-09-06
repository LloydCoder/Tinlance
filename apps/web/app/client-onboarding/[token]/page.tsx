"use client";

import { useState } from "react";

export default function ClientOnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  useState(() => { void params.then((value) => setToken(value.token)); });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("submitting");
    try {
      const response = await fetch("/api/v1/commercial/client-onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, name, password }) });
      const body = await response.json().catch(() => null) as { error?: string; redirectTo?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "activation_failed");
      setStatus("success"); setMessage("Your client access is activated. Sign in to open the secure portal.");
      if (body?.redirectTo) window.setTimeout(() => { window.location.href = body.redirectTo as string; }, 1200);
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "We could not activate your access."); }
  }

  return <main className="section-v2"><div className="container" style={{ paddingTop: "8rem", paddingBottom: "8rem", maxWidth: "680px" }}><p className="kicker">TINLANCE / CLIENT ACCESS</p><h1>Activate your client workspace.</h1><p style={{ marginTop: "1rem" }}>Set your portal password. Your access is scoped to your organization and its engagement.</p><form onSubmit={submit} className="mt-8 grid gap-5 rounded-[24px] border border-neutral-200 bg-white p-7"><label className="grid gap-2 text-sm font-semibold">Name<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4" autoComplete="name" /></label><label className="grid gap-2 text-sm font-semibold">Password<input required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4" type="password" autoComplete="new-password" /></label><button className="button button-dark w-fit" disabled={!token || status === "submitting"} type="submit">{status === "submitting" ? "Activating…" : "Activate access"}</button>{message && <p className={status === "error" ? "text-sm text-red-700" : "text-sm"} role={status === "error" ? "alert" : "status"}>{message}</p>}</form></div></main>;
}
