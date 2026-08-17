"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

const services = [
  "Forward Deployed Engineering",
  "AI Engineering",
  "AI Security",
  "Enterprise Automation",
  "Other / not sure",
];

export function LeadForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const form = new FormData(event.currentTarget);
    const key = idempotencyKey ?? crypto.randomUUID();
    if (!idempotencyKey) setIdempotencyKey(key);

    try {
      const response = await fetch("/api/v1/operations/lead", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": key,
        },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      setStatus(response.ok ? "success" : "error");
      if (response.ok) {
        event.currentTarget.reset();
        setIdempotencyKey(null);
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-[24px] border border-neutral-200 bg-white p-8"
        role="status"
      >
        <CheckCircle2 className="mb-5" aria-hidden="true" />
        <p className="kicker">REQUEST RECEIVED</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          We have the context.
        </h2>
        <p className="mt-4 max-w-xl text-neutral-600">
          Your request has been accepted. We will review the problem,
          constraints, and desired outcome before the next conversation.
        </p>
        <a className="button button-dark mt-7" href="/assessment">
          Book a technical assessment{" "}
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Organization
          <input
            required
            name="organizationName"
            minLength={2}
            maxLength={160}
            className="min-h-12 rounded-xl border border-neutral-300 bg-white px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
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
            className="min-h-12 rounded-xl border border-neutral-300 bg-white px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            autoComplete="name"
          />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Work email
          <input
            required
            type="email"
            name="email"
            maxLength={254}
            className="min-h-12 rounded-xl border border-neutral-300 bg-white px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            autoComplete="email"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Country
          <input
            required
            name="country"
            minLength={2}
            maxLength={80}
            className="min-h-12 rounded-xl border border-neutral-300 bg-white px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            autoComplete="country-name"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        What do you need help with?
        <select
          required
          name="service"
          className="min-h-12 rounded-xl border border-neutral-300 bg-white px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
        >
          <option value="">Select a capability</option>
          {services.map((service) => (
            <option key={service}>{service}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Problem and desired outcome
        <textarea
          name="notes"
          maxLength={4000}
          rows={6}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
          placeholder="What are you trying to build, fix, automate, or secure?"
        />
      </label>
      <label
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        Website
        <input tabIndex={-1} autoComplete="off" name="website" />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          className="button button-accent"
          disabled={status === "submitting"}
          type="submit"
        >
          {status === "submitting" ? "Sending…" : "Start the conversation"}{" "}
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
        {status === "error" && (
          <p className="text-sm text-red-700" role="alert">
            We could not submit this request. Please try again.
          </p>
        )}
      </div>
    </form>
  );
}
