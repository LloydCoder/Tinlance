"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function AssessmentPage() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const form = new FormData(event.currentTarget);
    const startsAt = String(form.get("startsAt") ?? "");

    try {
      const response = await fetch("/api/v1/operations/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationName: form.get("organizationName"),
          contactName: form.get("contactName"),
          email: form.get("email"),
          startsAt: new Date(startsAt).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notes: form.get("notes"),
        }),
      });
      setStatus(response.ok ? "success" : "error");
      if (response.ok) event.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <main>
      <section className="section-v2 dark-section">
        <div
          className="container"
          style={{ paddingTop: "7rem", paddingBottom: "6rem" }}
        >
          <p className="kicker kicker-dark">
            TINLANCE / TECHNICAL ASSESSMENT
          </p>
          <h1 style={{ maxWidth: "920px" }}>
            Start with the system, not the sales pitch.
          </h1>
          <p
            style={{
              maxWidth: "700px",
              fontSize: "1.2rem",
              marginTop: "1.5rem",
            }}
          >
            Choose a time for a focused engineering conversation. Bring the
            workflow, constraints, existing architecture, and outcome you
            care about.
          </p>
        </div>
      </section>

      <section className="section-v2">
        <div className="container" style={{ maxWidth: "900px" }}>
          {status === "success" ? (
            <div
              className="rounded-[24px] border border-neutral-200 bg-white p-8"
              role="status"
            >
              <CheckCircle2 className="mb-5" aria-hidden="true" />
              <p className="kicker">REQUEST ACCEPTED</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Your assessment request is in.
              </h2>
              <p className="mt-4 max-w-xl text-neutral-600">
                We have the requested time, timezone, and context. The booking
                system will confirm the next step through the configured
                scheduling workflow.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="grid gap-5 rounded-[28px] border border-neutral-200 bg-white p-6 md:p-10"
              noValidate
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Organization
                  <input
                    required
                    name="organizationName"
                    minLength={2}
                    maxLength={160}
                    className="min-h-12 rounded-xl border border-neutral-300 px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                    autoComplete="organization"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Your name
                  <input
                    required
                    name="contactName"
                    minLength={2}
                    maxLength={120}
                    className="min-h-12 rounded-xl border border-neutral-300 px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                    autoComplete="name"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Work email
                <input
                  required
                  type="email"
                  name="email"
                  maxLength={254}
                  className="min-h-12 rounded-xl border border-neutral-300 px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  autoComplete="email"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Preferred time
                <input
                  required
                  type="datetime-local"
                  name="startsAt"
                  className="min-h-12 rounded-xl border border-neutral-300 px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                />
                <span className="text-xs font-normal text-neutral-500">
                  Your browser timezone is submitted automatically.
                </span>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Context for the assessment
                <textarea
                  name="notes"
                  maxLength={4000}
                  rows={7}
                  className="rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="Architecture, workflow, constraints, security requirements, target outcome…"
                />
              </label>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  className="button button-accent"
                  disabled={status === "submitting"}
                  type="submit"
                >
                  {status === "submitting"
                    ? "Submitting…"
                    : "Request assessment"}{" "}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
                {status === "error" && (
                  <p className="text-sm text-red-700" role="alert">
                    We could not submit the request. Check the fields and try
                    again.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
