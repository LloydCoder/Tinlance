"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";

const steps = ["Objective", "Technical context", "Business context", "Review"] as const;
type FormState = Record<string, string | boolean>;
type Errors = Record<string, string>;

const initialForm: FormState = {
  organizationName: "", contactName: "", email: "", country: "", roleTitle: "", companySize: "", website: "", capability: "",
  problem: "", workflow: "", currentArchitecture: "", constraints: "", desiredOutcome: "", urgency: "exploring", stakeholders: "",
  existingSystems: "", securityRequirements: "", businessImpact: "", timeline: "", technicalEnvironment: "", securitySensitivity: "standard",
  budgetSignal: "unknown", campaign: "", referral: "", consent: false,
};

const errorText = (name: string) => `${name}-error`;

export default function AssessmentPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<{ qualification: { status: string; message: string; nextAction: string } } | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [bookingMessage, setBookingMessage] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const firstErrorRef = useRef<string | null>(null);

  function track(eventName: "assessment_started" | "assessment_progressed" | "assessment_result_viewed" | "assessment_cta_clicked", properties: Record<string, string | number> = {}) {
    void fetch("/api/v1/analytics/events", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventName, source: "website", path: "/assessment", privacyClass: "PUBLIC", properties }),
      keepalive: true,
    }).catch(() => undefined);
  }

  useEffect(() => { track("assessment_started", { step: 1 }); }, []);
  useEffect(() => {
    if (result) {
      track("assessment_result_viewed", { qualified: result.qualification.status === "QUALIFIED" ? 1 : 0 });
      if (result.qualification.status === "QUALIFIED") {
        void fetch(`/api/v1/commercial/availability?timezone=${encodeURIComponent(timezone)}`)
          .then((response) => response.ok ? response.json() : { slots: [] })
          .then((body: { slots?: string[] }) => setSlots(body.slots ?? []))
          .catch(() => setSlots([]));
      }
    }
  }, [result, timezone]);

  function setField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
    setServerError("");
  }

  function validateCurrentStep(): Errors {
    const next: Errors = {};
    const required: Record<number, Array<[string, string, number]>> = {
      0: [["capability", "Tell us what capability you need.", 120], ["problem", "Describe the problem you want to solve.", 4000], ["desiredOutcome", "Describe the outcome you want.", 3000]],
      1: [],
      2: [["organizationName", "Enter your organization name.", 160], ["contactName", "Enter your name.", 120], ["email", "Enter a valid work email address.", 254], ["country", "Enter your country.", 80]],
    };
    for (const [name, message, max] of required[step] ?? []) {
      const value = String(form[name] ?? "").trim();
      if (!value) next[name] = message;
      else if (value.length > max) next[name] = `Use ${max.toLocaleString()} characters or fewer.`;
    }
    if (step === 2 && String(form.email).trim() && !/^\S+@\S+\.\S+$/.test(String(form.email).trim())) next.email = "Enter a valid work email address.";
    if (step === 2 && form.website && !/^https?:\/\//i.test(String(form.website))) next.website = "Enter a complete website URL, including https://.";
    if (step === 2 && form.consent !== true) next.consent = "Consent is required to submit this assessment.";
    return next;
  }

  function focusFirstError(next: Errors) {
    const first = Object.keys(next)[0];
    if (!first) return;
    firstErrorRef.current = first;
    requestAnimationFrame(() => document.getElementById(first)?.focus());
  }

  function nextStep() {
    const next = validateCurrentStep();
    if (Object.keys(next).length) { setErrors(next); focusFirstError(next); track("assessment_progressed", { step: step + 1, valid: 0 }); return; }
    setErrors({});
    setStep((current) => Math.min(current + 1, steps.length - 1));
    track("assessment_progressed", { step: step + 2, valid: 1 });
  }

  function previousStep() {
    setErrors({}); setServerError(""); setStep((current) => Math.max(current - 1, 0));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validateCurrentStep();
    if (Object.keys(next).length) { setErrors(next); focusFirstError(next); return; }
    setStatus("submitting"); setServerError("");
    const payload = { ...form, source: "website", consent: form.consent === true };
    try {
      const response = await fetch("/api/v1/commercial/assessments", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body.fields && typeof body.fields === "object") setErrors(body.fields as Errors);
        setServerError(response.status === 429 ? "Too many submissions. Please wait a moment and try again." : response.status === 413 ? "The assessment is too large. Shorten the long-text answers and try again." : "We could not validate this submission. Check the highlighted fields and try again.");
        setStatus("idle");
        if (body.fields) focusFirstError(body.fields as Errors);
        return;
      }
      setResult(body); setStatus("success"); track("assessment_result_viewed", { submitted: 1 });
    } catch {
      setServerError("We could not reach the assessment service. Your answers are still on this page; please try again."); setStatus("idle");
    }
  }

  async function book() {
    if (!selectedSlot || !result) return;
    setBookingStatus("submitting"); setBookingMessage(""); track("assessment_cta_clicked", { action: "booking" });
    try {
      const response = await fetch("/api/v1/operations/booking", {
        method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ organizationName: form.organizationName, contactName: form.contactName, email: form.email, startsAt: selectedSlot, timezone, notes: String(form.problem), assessmentReference: idempotencyKey }),
      });
      if (!response.ok) throw new Error("booking_failed");
      setBookingStatus("success"); setBookingMessage("Your technical discovery time has been requested.");
    } catch { setBookingStatus("error"); setBookingMessage("That time could not be requested. Please choose another available time."); }
  }

  if (result) {
    return <div><section className="section-v2 dark-section"><div className="container" style={{ paddingTop: "7rem", paddingBottom: "5rem" }}><p className="kicker kicker-dark">TINLANCE / ASSESSMENT</p><h1 style={{ maxWidth: "900px" }}>Assessment received.</h1><p style={{ maxWidth: "720px", fontSize: "1.2rem", marginTop: "1.5rem" }}>{result.qualification.message}</p></div></section><section className="section-v2"><div className="container" style={{ maxWidth: "920px" }}><div className="grid gap-6"><section className="rounded-[24px] border border-neutral-200 bg-white p-8" role="status" aria-live="polite"><CheckCircle2 className="mb-5" aria-hidden="true" /><p className="kicker">NEXT STEP</p><h2 className="text-3xl font-semibold tracking-tight">{result.qualification.status === "QUALIFIED" ? "Technical discovery is available." : "Your technical context is under review."}</h2><p className="mt-4 text-neutral-700">{result.qualification.message}</p></section>{result.qualification.status === "QUALIFIED" && <section className="rounded-[24px] border border-neutral-200 bg-white p-8"><p className="kicker">BOOKING</p><h2 className="text-2xl font-semibold">Choose an available technical discovery time</h2><p className="mt-2 text-neutral-600">Times are shown in your browser timezone ({timezone}).</p><label className="mt-5 grid gap-2 text-sm font-semibold" htmlFor="slot">Available time<select id="slot" value={selectedSlot} onChange={(event) => setSelectedSlot(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4"><option value="">Select a time</option>{slots.map((slot) => <option key={slot} value={slot}>{new Date(slot).toLocaleString()}</option>)}</select></label><button className="button button-dark mt-4" disabled={!selectedSlot || bookingStatus === "submitting"} onClick={book}>{bookingStatus === "submitting" ? "Requesting…" : "Request technical discovery"} <ArrowUpRight size={17} aria-hidden="true" /></button>{bookingMessage && <p className={bookingStatus === "error" ? "mt-3 text-sm text-red-700" : "mt-3 text-sm"} role="alert">{bookingMessage}</p>}</section>}</div></div></section></div>;
  }

  const input = (name: string, label: string, type = "text", placeholder?: string) => <label className="grid gap-2 text-sm font-semibold" htmlFor={name}>{label}<input id={name} name={name} type={type} value={String(form[name] ?? "")} onChange={(event) => setField(name, event.target.value)} maxLength={name === "email" ? 254 : 500} autoComplete={name === "email" ? "email" : name === "contactName" ? "name" : name === "organizationName" ? "organization" : undefined} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? errorText(name) : undefined} className="min-h-12 rounded-xl border border-neutral-300 px-4" placeholder={placeholder} />{errors[name] && <span id={errorText(name)} className="text-sm font-normal text-red-700">{errors[name]}</span>}</label>;
  const textarea = (name: string, label: string, maxLength: number, rows = 5) => <label className="grid gap-2 text-sm font-semibold md:col-span-2" htmlFor={name}>{label}<textarea id={name} name={name} value={String(form[name] ?? "")} onChange={(event) => setField(name, event.target.value)} maxLength={maxLength} rows={rows} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? errorText(name) : undefined} className="rounded-xl border border-neutral-300 px-4 py-3" />{errors[name] && <span id={errorText(name)} className="text-sm font-normal text-red-700">{errors[name]}</span>}</label>;

  return <div><section className="section-v2 dark-section"><div className="container" style={{ paddingTop: "7rem", paddingBottom: "4rem" }}><p className="kicker kicker-dark">TINLANCE / TECHNICAL ASSESSMENT</p><h1 style={{ maxWidth: "900px" }}>Start with the system, not the sales pitch.</h1><p style={{ maxWidth: "720px", fontSize: "1.2rem", marginTop: "1.5rem" }}>A focused technical intake that captures the context Tinlance needs to determine fit and the right next step.</p></div></section><section className="section-v2"><div className="container" style={{ maxWidth: "920px" }}><div className="mb-6" aria-label="Assessment progress"><p className="text-sm font-semibold" aria-live="polite">Step {step + 1} of {steps.length} — {steps[step]}</p><div className="mt-3 grid grid-cols-4 gap-2">{steps.map((label, index) => <div key={label} className={`rounded-full border px-2 py-2 text-center text-xs ${index === step ? "border-neutral-900 font-semibold" : index < step ? "border-neutral-400" : "border-neutral-200 text-neutral-500"}`}>{index + 1}</div>)}</div></div><form onSubmit={submit} className="grid gap-6 rounded-[28px] border border-neutral-200 bg-white p-6 md:p-10" noValidate>
    {step === 0 && <div className="grid gap-5 md:grid-cols-2"><div className="md:col-span-2">{input("capability", "What capability do you need?", "text", "e.g. AI security, automation, FDE, technical assessment")}</div>{textarea("problem", "What problem are you trying to solve?", 4000)}{textarea("desiredOutcome", "What outcome would make this successful?", 3000)}</div>}
    {step === 1 && <div className="grid gap-5 md:grid-cols-2"><div className="md:col-span-2">{textarea("workflow", "What workflow or process is involved?", 4000)}</div>{textarea("currentArchitecture", "Current architecture / process", 4000)}{textarea("existingSystems", "Existing systems and integrations", 3000)}{textarea("technicalEnvironment", "Technical environment", 3000)}{textarea("constraints", "Constraints or dependencies", 4000)}<label className="grid gap-2 text-sm font-semibold">Security sensitivity<select value={String(form.securitySensitivity)} onChange={(event) => setField("securitySensitivity", event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4"><option value="standard">Standard</option><option value="sensitive">Sensitive</option><option value="regulated">Regulated</option><option value="critical">Critical</option></select></label><div className="grid gap-2 text-sm font-semibold"><span>Security requirements</span><textarea id="securityRequirements" value={String(form.securityRequirements)} onChange={(event) => setField("securityRequirements", event.target.value)} maxLength={3000} rows={5} className="rounded-xl border border-neutral-300 px-4 py-3" />{form.securitySensitivity !== "standard" && <span className="text-xs font-normal text-neutral-600">Add only the security/compliance context relevant to this request.</span>}</div></div>}
    {step === 2 && <div className="grid gap-5 md:grid-cols-2">{input("organizationName", "Organization")}{input("contactName", "Your name")}{input("email", "Work email", "email")}{input("country", "Country")}{input("roleTitle", "Role / title")}{input("companySize", "Company size")}{input("website", "Company website", "url", "https://example.com")}{input("timeline", "Timeline")}{input("stakeholders", "Stakeholders / decision makers")}{input("businessImpact", "Expected business impact")}
      <label className="grid gap-2 text-sm font-semibold">Urgency<select value={String(form.urgency)} onChange={(event) => setField("urgency", event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4"><option value="exploring">Exploring</option><option value="90_days">Within 90 days</option><option value="30_days">Within 30 days</option><option value="urgent">Urgent</option></select></label>
      <label className="grid gap-2 text-sm font-semibold">Budget signal<select value={String(form.budgetSignal)} onChange={(event) => setField("budgetSignal", event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-4"><option value="unknown">Not decided</option><option value="under_5k">Under $5k</option><option value="5k_25k">$5k–25k</option><option value="25k_100k">$25k–100k</option><option value="100k_plus">$100k+</option></select></label>
      <label className="md:col-span-2 flex items-start gap-3 text-sm font-normal"><input id="consent" name="consent" type="checkbox" checked={Boolean(form.consent)} onChange={(event) => setField("consent", event.target.checked)} className="mt-1" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? errorText("consent") : undefined} /><span>I agree that Tinlance may use this information to evaluate and respond to this request.</span></label>{errors.consent && <span id={errorText("consent")} className="md:col-span-2 text-sm text-red-700">{errors.consent}</span>}
      <input name="websiteTrap" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" value="" readOnly />
    </div>}
    {step === 3 && <div className="grid gap-6"><div><p className="kicker">REVIEW</p><h2 className="text-2xl font-semibold">Check the information before submission</h2><p className="mt-2 text-neutral-600">You can go back and edit any section. Internal qualification details are not shown here.</p></div><div className="grid gap-4 md:grid-cols-2">{[["Objective", form.capability], ["Problem", form.problem], ["Desired outcome", form.desiredOutcome], ["Technical context", form.technicalEnvironment || form.currentArchitecture], ["Security sensitivity", form.securitySensitivity], ["Organization", form.organizationName], ["Role", form.roleTitle], ["Timeline", form.timeline], ["Budget", form.budgetSignal], ["Work email", form.email]].map(([label, value]) => <div key={label as string} className="rounded-xl border border-neutral-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 break-words text-sm">{String(value || "Not provided")}</p></div>)}</div></div>}
    {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
    <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-between"><button type="button" className="button button-light" onClick={previousStep} disabled={step === 0 || status === "submitting"}><ArrowLeft size={17} aria-hidden="true" /> Back</button>{step < 3 ? <button type="button" className="button button-dark" onClick={nextStep}>Continue <ArrowRight size={17} aria-hidden="true" /></button> : <button type="submit" className="button button-accent" disabled={status === "submitting"}>{status === "submitting" ? "Securely submitting…" : "Submit technical assessment"} <ArrowUpRight size={17} aria-hidden="true" /></button>}</div>
  </form></div></section></div>;
}
