"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { EmployeeRole } from "@/lib/quotes/types";

type Employee = { id: string; email: string; name: string; role: EmployeeRole; active: boolean };
const roles: EmployeeRole[] = ["EMPLOYEE", "MANAGER", "ADMIN"];

export default function TeamManager({ currentEmail }: { currentEmail: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployeeRole>("EMPLOYEE");
  const [setupLink, setSetupLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/internal/employees", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not load employees.");
      setEmployees(data.employees || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load employees.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/internal/employees", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not create account.");
      setSetupLink(`${window.location.origin}${data.setupPath}`);
      setName(""); setEmail(""); setRole("EMPLOYEE");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create account.");
    } finally {
      setSaving(false);
    }
  }

  async function change(id: string, patch: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/internal/employees", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not update account.");
      if (data.setupPath) setSetupLink(`${window.location.origin}${data.setupPath}`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="apex-agent-shell min-h-screen px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div><p className="apex-agent-eyebrow">Apex Coverage Internal</p><h1 className="mt-1 text-3xl font-bold">Team</h1></div>
          <Link href="/agent" className="apex-agent-button-secondary px-4 py-2 text-sm">Back to dashboard</Link>
        </div>
        {error && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <section className="apex-agent-card-light mb-6 p-5">
          <h2 className="text-lg font-semibold">Add employee</h2>
          <form onSubmit={invite} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_150px_auto] md:items-end">
            <label className="text-sm">Name<input className="apex-agent-input mt-1 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label className="text-sm">Email<input className="apex-agent-input mt-1 px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="text-sm">Role<select className="apex-agent-input mt-1 px-3 py-2" value={role} onChange={(event) => setRole(event.target.value as EmployeeRole)}>{roles.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <button className="apex-agent-button-primary px-4 py-2 text-sm" disabled={saving}>Create account</button>
          </form>
          <p className="mt-3 text-sm text-slate-600">A one-time setup link will appear below. It expires after 24 hours.</p>
          {setupLink && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
            <span className="min-w-0 flex-1 break-all">{setupLink}</span>
            <button type="button" className="apex-agent-button-secondary px-3 py-1" onClick={() => navigator.clipboard.writeText(setupLink)}>Copy link</button>
          </div>}
        </section>
        <section className="apex-agent-card-light overflow-x-auto p-5">
          <h2 className="text-lg font-semibold">Employee accounts</h2>
          {loading ? <p className="mt-4 text-sm">Loading employees...</p> : <table className="mt-4 w-full min-w-[650px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-600"><th className="py-2">Employee</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{employees.map((employee) => <tr className="border-b border-slate-100" key={employee.id}>
              <td className="py-3"><strong className="block">{employee.name}</strong><span className="text-slate-600">{employee.email}</span></td>
              <td><select aria-label={`Role for ${employee.name}`} className="rounded border border-slate-300 px-2 py-1" value={employee.role} disabled={saving || employee.email === currentEmail} onChange={(event) => change(employee.id, { role: event.target.value })}>{roles.map((value) => <option key={value} value={value}>{value}</option>)}</select></td>
              <td>{employee.active ? "Active" : "Inactive"}</td>
              <td className="space-x-3 text-right">
                {employee.active && <button type="button" className="text-blue-700 underline" disabled={saving} onClick={() => change(employee.id, { action: "reset" })}>Reset password</button>}
                {!employee.active && <button type="button" className="text-blue-700 underline" disabled={saving} onClick={async () => {
                  setSaving(true);
                  setError("");
                  try {
                    const response = await fetch("/api/internal/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: employee.email, name: employee.name, role: employee.role }) });
                    const data = await response.json();
                    if (!response.ok || !data.ok) throw new Error(data.error || "Could not create a new setup link.");
                    setSetupLink(`${window.location.origin}${data.setupPath}`);
                    await load();
                  } catch (cause) {
                    setError(cause instanceof Error ? cause.message : "Could not create a new setup link.");
                  } finally { setSaving(false); }
                }}>New setup link</button>}
                {employee.email !== currentEmail && <button type="button" className="text-blue-700 underline" disabled={saving} onClick={() => change(employee.id, { active: !employee.active })}>{employee.active ? "Deactivate" : "Reactivate"}</button>}
              </td>
            </tr>)}</tbody>
          </table>}
        </section>
      </div>
    </main>
  );
}
