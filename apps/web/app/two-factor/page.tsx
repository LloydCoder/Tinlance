"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (result.error) throw new Error(result.error.message ?? "Two-factor verification failed");
      const response = await fetch("/api/security/step-up", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
      if (!response.ok) throw new Error("Step-up authorization could not be established");
      window.history.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Two-factor verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16">
      <section className="w-full rounded-xl border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Additional verification</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter the six-digit code from your authenticator to continue the protected operation.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium" htmlFor="totp-code">Verification code</label>
          <input id="totp-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="w-full rounded-md border px-3 py-2" />
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <button type="submit" disabled={busy || code.length !== 6} className="w-full rounded-md border px-3 py-2 font-medium disabled:opacity-50">{busy ? "Verifying…" : "Verify and continue"}</button>
        </form>
      </section>
    </main>
  );
}
