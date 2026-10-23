"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EmployeeBar({ name, role }: { name: string; role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/internal/auth/logout", { method: "POST" });
      router.replace("/employee-sign-in");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return <div className="border-b border-white/10 bg-slate-950 px-4 py-2 text-xs text-slate-200">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
      <span className="font-semibold">Apex employee workspace <span className="font-normal text-slate-400">/ {name}</span></span>
      <div className="flex items-center gap-4">
        <Link href="/agent" className="hover:text-white">Pipeline</Link>
        <Link href="/agent/customers" className="hover:text-white">Customers</Link>
        <Link href="/agent/quotes" className="hover:text-white">Quotes</Link>
        {role === "ADMIN" && <Link href="/agent/team" className="hover:text-white">Team</Link>}
        <button type="button" disabled={busy} onClick={() => void signOut()} className="font-semibold text-blue-200 hover:text-white disabled:opacity-50">Sign out</button>
      </div>
    </div>
  </div>;
}
