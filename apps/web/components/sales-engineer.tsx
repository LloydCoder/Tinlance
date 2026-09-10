"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, Bot, Loader2, ShieldCheck } from "lucide-react";

type Citation = { title: string; url: string; excerpt: string; updatedAt: string; status: string };
type Message = { role: "user" | "assistant"; content: string; citations?: Citation[] };

const suggestions = [
  "What does Tinlance do?",
  "How can you help secure an AI agent?",
  "What is the FDE model?",
  "Can you help with a RAG architecture?",
];

export function SalesEngineer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(value = input) {
    const message = value.trim();
    if (!message || loading) return;
    const next = [...messages, { role: "user" as const, content: message }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sales-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history: messages.slice(-8).map(({ role, content }) => ({ role, content })) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Request failed");
      setMessages([...next, { role: "assistant", content: body.answer, citations: body.citations }]);
    } catch {
      setError("The assistant could not complete that request. Please try again or use the assessment form.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  return (
    <section aria-label="Tinlance AI Sales Engineer" className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm md:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-5">
        <div className="flex gap-3">
          <div className="mt-1 rounded-xl bg-neutral-950 p-2 text-white"><Bot size={19} aria-hidden="true" /></div>
          <div>
            <p className="font-semibold">AI Sales Engineer</p>
            <p className="mt-1 text-sm text-neutral-500">Public knowledge only · No private/customer data</p>
          </div>
        </div>
        <ShieldCheck size={20} aria-label="Grounded public knowledge boundary" />
      </div>

      <div className="mt-5 space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="rounded-2xl bg-neutral-50 p-5">
            <p className="font-medium">Start with a technical question.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void send(suggestion)} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-left text-sm hover:border-neutral-400">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((item, index) => (
          <div key={`${item.role}-${index}`} className={item.role === "user" ? "ml-auto max-w-[88%] rounded-2xl bg-neutral-950 px-4 py-3 text-white" : "max-w-[94%] rounded-2xl border border-neutral-200 px-4 py-3"}>
            <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
            {item.citations && item.citations.length > 0 && (
              <div className="mt-4 border-t border-neutral-200 pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Sources</p>
                <div className="mt-2 grid gap-2">
                  {item.citations.map((citation) => (
                    <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer" className="rounded-lg bg-neutral-50 p-2 text-xs hover:bg-neutral-100">
                      <span className="font-medium">{citation.title}</span>
                      <span className="mt-1 block text-neutral-500">Updated {citation.updatedAt}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Checking approved public evidence…</div>}
      </div>

      {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
      <form onSubmit={submit} className="mt-5 flex gap-2 border-t border-neutral-100 pt-5">
        <label className="sr-only" htmlFor="sales-engineer-message">Your technical question</label>
        <input id="sales-engineer-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} disabled={loading} placeholder="Ask about a technical problem…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10" />
        <button type="submit" disabled={loading || !input.trim()} className="button button-accent" aria-label="Send question">
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </form>
      <p className="mt-3 text-xs text-neutral-500">Do not enter credentials, secrets, confidential source code, or customer data.</p>
      <a href="/assessment" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Book a technical assessment <ArrowUpRight size={15} aria-hidden="true" /></a>
    </section>
  );
}
