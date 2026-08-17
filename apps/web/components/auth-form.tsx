"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignUp = mode === "sign-up";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = isSignUp
      ? await authClient.signUp.email({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          callbackURL: "/portal",
        })
      : await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
          callbackURL: "/portal",
        });

    setPending(false);

    if (result.error) {
      setError(result.error.message || "Authentication failed. Please try again.");
      return;
    }

    router.replace("/portal");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Tinlance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
      </div>

      {isSignUp && (
        <label className="block text-sm font-medium">
          Name
          <input
            required
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-black"
            autoComplete="name"
          />
        </label>
      )}

      <label className="block text-sm font-medium">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-black"
          autoComplete="email"
        />
      </label>

      <label className="block text-sm font-medium">
        Password
        <input
          required
          type="password"
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-black"
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
      >
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
