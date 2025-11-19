'use client';

import React, { useEffect, useState } from 'react';

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
  status: string;
};

const AGENT_PASSWORD = 'apex2025'; 
// ^ CHANGE THIS to whatever you want your internal password to be.
// This is a simple gate, not bank-level security. It’s fine for a tiny internal tool.

export default function AgentDashboardPage() {
  const [inputPassword, setInputPassword] = useState('');
  const [authed, setAuthed] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/agent/leads');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || 'Unknown error from /api/agent/leads');
      }
      setLeads(data.rows || []);
    } catch (err: any) {
      console.error('Failed to load leads', err);
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  // Load leads once we’re authenticated
  useEffect(() => {
    if (authed) {
      loadLeads();
    }
  }, [authed]);

  // Simple password gate
  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white border rounded-xl shadow-md p-6 w-full max-w-sm">
          <h1 className="text-xl font-semibold mb-2">Apex Agent Portal</h1>
          <p className="text-sm text-gray-600 mb-4">
            This area is for internal use only.
          </p>
          <label className="block text-sm font-medium mb-1">
            Agent password
          </label>
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm mb-3"
            placeholder="Enter password"
          />
          <button
            onClick={() => {
              if (inputPassword === AGENT_PASSWORD) {
                setAuthed(true);
              } else {
                alert('Incorrect password');
              }
            }}
            className="w-full bg-[#cc0000] text-white font-semibold rounded-md py-2 text-sm hover:bg-red-700"
          >
            Unlock dashboard
          </button>
        </div>
      </main>
    );
  }

  // Authenticated view
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Apex Agent Dashboard</h1>
            <p className="text-xs text-gray-500">
              Internal CRM view · pulled from Google Sheets “Leads” tab
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLeads}
              className="px-3 py-1.5 rounded-md text-sm border bg-white hover:bg-gray-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                setAuthed(false);
                setInputPassword('');
              }}
              className="px-3 py-1.5 rounded-md text-xs text-gray-600 border border-gray-300 bg-white hover:bg-gray-50"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Showing <b>{leads.length}</b> leads
          </div>
        </div>

        <div className="overflow-auto border rounded-xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Contact</th>
                <th className="px-3 py-2 text-left">Vehicle</th>
                <th className="px-3 py-2 text-left">ZIP</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const vehicle = [lead.year, lead.make, lead.model]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 align-top text-xs text-gray-500">
                      {lead.when}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-gray-500">
                        DOB: {lead.dob || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs">
                      <div>
                        <a
                          className="text-[#cc0000] hover:underline"
                          href={`mailto:${lead.email}`}
                        >
                          {lead.email}
                        </a>
                      </div>
                      <div>
                        <a
                          className="text-[#cc0000] hover:underline"
                          href={`tel:${lead.phone}`}
                        >
                          {lead.phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs">
                      {vehicle || '—'}
                    </td>
                    <td className="px-3 py-2 align-top text-xs">
                      {lead.zip || '—'}
                    </td>
                    <td className="px-3 py-2 align-top text-xs">
                      {lead.status || (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {leads.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-gray-500"
                  >
                    No leads found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
