"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function QuoteLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/internal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Sign in failed.");
      router.push(searchParams.get("next") || "/agent/quotes");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#cc0000]">
          Apex Coverage Internal
        </p>
        <h1 className="mt-1 text-2xl font-bold">Employee Sign In</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to create and review internal quote estimates.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Employee email</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Password</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
