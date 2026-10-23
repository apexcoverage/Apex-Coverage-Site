"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ActivateEmployeePage() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/internal/auth/activate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not set password.");
      router.push("/employee-sign-in");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not set password.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="apex-agent-shell grid min-h-screen place-items-center px-4 py-12">
    <div className="apex-agent-card-light w-full max-w-md p-6">
      <p className="apex-agent-eyebrow">Apex Coverage Internal</p>
      <h1 className="mt-2 text-2xl font-bold">Set your password</h1>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm">Password<input type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="apex-agent-input mt-1 px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className="block text-sm">Confirm password<input type="password" autoComplete="new-password" required className="apex-agent-input mt-1 px-3 py-2" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button className="apex-agent-button-primary w-full px-4 py-2" disabled={saving || !token}>{saving ? "Saving..." : "Set password"}</button>
      </form>
    </div>
  </main>;
}
