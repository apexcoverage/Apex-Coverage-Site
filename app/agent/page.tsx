"use client";

import React, { useEffect, useState } from "react";

type Lead = {
  id: number;
  when: string;
  name: string;
  email: string;
  phone: string;
  zip: string;
  dob: string;
  year: string;
  make: string;
  model: string;
  consent: string;
  status?: string;
  agent?: string;
};

type ApiListResponse = {
  ok: boolean;
  rows?: Lead[];
  error?: string;
};

// tweak these to your actual agents
const AGENTS = ["", "Lewis", "Brandon", "Kelly"];

const STATUS_OPTIONS = [
  "",
  "New",
  "Attempted Contact",
  "In Progress",
  "Quoted",
  "Won",
  "Lost",
  "Do Not Contact",
];

export default function AgentDashboardPage() {
  // -------------------------------
  // 🔐 AUTHENTICATION STATE
  // -------------------------------
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // restore auth from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("apex_agent_authed");
    if (saved === "1") {
      setIsAuthed(true);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const expected = process.env.NEXT_PUBLIC_AGENT_PORTAL_KEY;
    if (!expected) {
      setAuthError("Portal key missing in environment.");
      return;
    }

    if (password === expected) {
      setIsAuthed(true);
      setAuthError(null);
      localStorage.setItem("apex_agent_authed", "1");
    } else {
      setAuthError("Incorrect access code.");
    }
  }

  // -------------------------------
  // LEADS DATA
  // -------------------------------
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/agent/leads", { cache: "no-store" });
      const data: ApiListResponse = await res.json();
      if (!data.ok || !data.rows) {
        throw new Error(data.error || "Failed to load leads");
      }
      setLeads(data.rows);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthed) loadLeads();
  }, [isAuthed]);

  async function updateLead(id: number, patch: Partial<Lead>) {
    setSavingId(id);
    try {
      const res = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Update failed");
      }

      // update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, ...patch } : lead
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(`Could not save changes: ${err.message || err}`);
    } finally {
      setSavingId(null);
    }
  }

  // -------------------------------
  // 🔐 LOGIN SCREEN
  // -------------------------------
  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">
          <h1 className="text-xl font-semibold text-center mb-4">
            Apex Coverage – Agent Portal
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Access Code</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Enter agent code"
              />
            </div>

            {authError && (
              <div className="text-sm text-red-600">{authError}</div>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-red-600 text-white py-2 font-semibold hover:bg-red-700"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    );
  }

  // -------------------------------
  // MAIN DASHBOARD
  // -------------------------------
  return (
    <main className="min-h-screen bg-slate-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-sm text-gray-600">
              View and manage quote leads synced from Google Sheets.
            </p>
          </div>
          <button
            onClick={loadLeads}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-600">Loading leads…</div>
        ) : leads.length === 0 ? (
          <div className="text-sm text-gray-600">No leads found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Vehicle</th>
                  <th className="px-3 py-2 font-semibold">Contact</th>
                  <th className="px-3 py-2 font-semibold">ZIP</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Agent</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead) => {
                  const vehicle = [lead.year, lead.make, lead.model]
                    .filter(Boolean)
                    .join(" ");
                  const disabled = savingId === lead.id;

                  return (
                    <tr
                      key={lead.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                        {lead.when}
                      </td>

                      <td className="px-3 py-2">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-gray-500">
                          DOB: {lead.dob || "—"}
                        </div>
                      </td>

                      <td className="px-3 py-2">{vehicle || "—"}</td>

                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-700">
                          {lead.phone || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.email || ""}
                        </div>
                      </td>

                      <td className="px-3 py-2">{lead.zip}</td>

                      <td className="px-3 py-2">
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                          value={lead.status || ""}
                          disabled={disabled}
                          onChange={(e) =>
                            updateLead(lead.id, { status: e.target.value })
                          }
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt || "—"}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2">
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                          value={lead.agent || ""}
                          disabled={disabled}
                          onChange={(e) =>
                            updateLead(lead.id, { agent: e.target.value })
                          }
                        >
                          {AGENTS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt || "Unassigned"}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
