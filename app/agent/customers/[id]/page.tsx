"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  policyNumber?: string; // stored policy number from Sheets

  // NEW: policy-related fields (for now, UI-only until we wire Sheets)
  coverage?: string;
  deductibles?: string;
  discounts?: string;
  renewalDate?: string;
  vehicles?: string; // multiline text, one vehicle per line
};

type ApiListResponse = {
  ok: boolean;
  rows?: Lead[];
  error?: string;
};

type ActivityNote = {
  id: number;
  text: string;
  createdAt: string;
  agent: string;
};

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityNotes, setActivityNotes] = useState<ActivityNote[]>([]);

  // --- Edit profile state ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    // contact
    name: "",
    email: "",
    phone: "",
    zip: "",
    dob: "",
    agent: "",

    // policy
    coverage: "",
    deductibles: "",
    discounts: "",
    renewalDate: "",
    vehicles: "", // one vehicle per line
  });

  // Helpers
  function getPhoneHref(phone: string | undefined) {
    if (!phone) return "#";
    return `tel:${phone.replace(/\D/g, "")}`;
  }

  const handleBackToCustomers = () => {
    router.push("/agent/customers");
  };

  // Open edit panel and prefill with current customer data
  const openEditProfile = () => {
    if (!customer) return;

    // fallback single vehicle string from basic year/make/model
    const fallbackVehicle = [customer.year, customer.make, customer.model]
      .filter(Boolean)
      .join(" ");

    setEditForm({
      // contact
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      zip: customer.zip || "",
      dob: customer.dob || "",
      agent: customer.agent || "",

      // policy, with sensible defaults
      coverage: customer.coverage || "Full Coverage",
      deductibles:
        customer.deductibles || "$500 Comp / $1,000 Collision",
      discounts: customer.discounts || "",
      renewalDate: customer.renewalDate || "",
      vehicles: customer.vehicles || fallbackVehicle,
    });
    setIsEditing(true);
  };

  const handleEditProfile = () => {
    openEditProfile();
  };

  const handleEditContactDetails = () => {
    openEditProfile();
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Save contact + policy changes
  // NOTE: policy fields are currently UI-only; we'll wire them to Sheets later.
  const handleSaveEdit = async () => {
    if (!customer) return;

    try {
      const res = await fetch("/api/agent/customers/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id, // row number in Leads sheet
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          zip: editForm.zip,
          dob: editForm.dob,
          agent: editForm.agent,
          // When we extend Sheets + Apps Script, we can add coverage, deductibles, etc. here.
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Failed to save customer.");
      }

      // If backend save was successful, update local UI (contact + policy)
      setCustomer({
        ...customer,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        zip: editForm.zip,
        dob: editForm.dob,
        agent: editForm.agent,
        coverage: editForm.coverage,
        deductibles: editForm.deductibles,
        discounts: editForm.discounts,
        renewalDate: editForm.renewalDate,
        vehicles: editForm.vehicles,
      });

      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      alert(
        "There was a problem saving this customer to Google Sheets. Please try again."
      );
    }
  };

  const handleViewFullPolicy = () => {
    alert("Full policy view coming soon.");
  };

  const handleCollectFirstPayment = () => {
    alert(
      "Collect First Payment will be wired to Stripe next. For now this is just a placeholder."
    );
  };

  const handleStartMonthlyBilling = () => {
    alert(
      "Start Monthly Billing will create a recurring Stripe subscription (coming next)."
    );
  };

  const handleChargeCustomerNow = () => {
    alert(
      "Charge Customer Now will run a one-off Stripe payment using the card on file (coming next)."
    );
  };

  const handleUpdateCard = () => {
    alert("Update Card on File will open a Stripe update form (coming next).");
  };

  const handleViewAllPayments = () => {
    alert("Payment history details view coming soon.");
  };

  const handleViewReceipt = () => {
    alert("Receipt view/download from Stripe coming soon.");
  };

  const handleUploadFile = () => {
    alert("File upload (policy docs, IDs, etc.) coming soon.");
  };

  const handleViewFile = () => {
    alert("File viewer coming soon.");
  };

  const handleDownloadFile = () => {
    alert("File download coming soon.");
  };

  const handleAddNote = () => {
    const text = window.prompt("Add a note for this customer:");
    if (!text || !text.trim()) return;

    const agentName = customer?.agent || "Agent";
    const newNote: ActivityNote = {
      id: Date.now(),
      text: text.trim(),
      createdAt: new Date().toLocaleString(),
      agent: agentName,
    };

    // newest note at top
    setActivityNotes((prev) => [newNote, ...prev]);
  };

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/agent/leads", { cache: "no-store" });
        const data: ApiListResponse = await res.json();

        if (!data.ok || !data.rows) {
          throw new Error(data.error || "Failed to load customers");
        }

        const idNumber = Number(params.id);
        const found = data.rows.find((lead) => lead.id === idNumber);

        if (!found) {
          throw new Error("Customer not found");
        }

        // Add some default policy values when we first load the customer
        const fallbackVehicle = [found.year, found.make, found.model]
          .filter(Boolean)
          .join(" ");

        setCustomer({
          ...found,
          coverage: found.coverage || "Full Coverage",
          deductibles:
            found.deductibles || "$500 Comp / $1,000 Collision",
          discounts: found.discounts || "",
          renewalDate: found.renewalDate || "",
          vehicles: found.vehicles || fallbackVehicle,
        });

        // seed some starter activity notes (you can replace with real data later)
        const starterAgent = found.agent || "Agent";
        setActivityNotes([
          {
            id: 2,
            text: "Collected first payment and set up monthly billing. Explained renewal terms.",
            createdAt: "Jan 12, 2025 · 11:02 AM",
            agent: starterAgent,
          },
          {
            id: 1,
            text: "Auto billing successful. Customer confirmed everything looks good.",
            createdAt: "Feb 12, 2025 · 3:14 PM",
            agent: starterAgent,
          },
        ]);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading customer");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      loadCustomer();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-600">
          Loading customer…
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="min-h-screen bg-slate-50 text-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <button
            onClick={handleBackToCustomers}
            className="mb-4 inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-100"
          >
            ← Back to customers
          </button>
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error || "Customer not found"}
          </div>
        </div>
      </main>
    );
  }

  // 👇 Base single-vehicle string from original lead data
  const fallbackVehicle = [customer.year, customer.make, customer.model]
    .filter(Boolean)
    .join(" ");

  // Vehicles for display: either multiline policy vehicles, or fallback
  const vehiclesRaw = customer.vehicles || fallbackVehicle || "";
  const vehicleLines = vehiclesRaw
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);

  // Use the stored policyNumber from Sheets, with a nice fallback
  const policyNumber =
    customer.policyNumber && customer.policyNumber.trim().length > 0
      ? customer.policyNumber
      : "Policy number not set";

  const coverageText = customer.coverage || "Full Coverage";
  const deductiblesText =
    customer.deductibles || "$500 Comp / $1,000 Collision";
  const discountsText =
    customer.discounts && customer.discounts.trim().length > 0
      ? customer.discounts
      : "—";
  const renewalText =
    customer.renewalDate && customer.renewalDate.trim().length > 0
      ? customer.renewalDate
      : "—";

  return (
    <>
      <div className="crm-page">
        {/* Top Header */}
        <header className="crm-header">
          <div className="crm-header-left">
            <button className="btn-secondary" onClick={handleBackToCustomers}>
              &larr; Back to Customers
            </button>
            <div className="crm-header-title">
              <h1>Customer Profile</h1>
              <span className="crm-breadcrumb">
                Dashboard &gt; Customers &gt; {customer.name || "Customer"}
              </span>
            </div>
          </div>
          <div className="crm-header-right">
            <button className="btn-secondary" onClick={handleAddNote}>
              Add Note
            </button>
            <button className="btn-primary" onClick={handleEditProfile}>
              Edit Profile
            </button>
          </div>
        </header>

        {/* Edit Profile Panel (inline, above main content) */}
        {isEditing && (
          <section className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header">
              <h3>Edit Profile</h3>
            </div>
            <div className="card-body">
              {/* Contact section */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "0.75rem",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label className="meta-text">Name</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Email</label>
                  <input
                    name="email"
                    value={editForm.email}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Phone</label>
                  <input
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">ZIP</label>
                  <input
                    name="zip"
                    value={editForm.zip}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Date of Birth</label>
                  <input
                    name="dob"
                    value={editForm.dob}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Assigned Agent</label>
                  <input
                    name="agent"
                    value={editForm.agent}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
              </div>

              {/* Policy section */}
              <hr style={{ margin: "0.5rem 0 1rem", borderColor: "#e5e7eb" }} />
              <h4
                style={{
                  fontSize: "0.95rem",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                Policy Details
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "0.75rem",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <label className="meta-text">Coverage</label>
                  <input
                    name="coverage"
                    value={editForm.coverage}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Deductibles</label>
                  <input
                    name="deductibles"
                    value={editForm.deductibles}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Discounts</label>
                  <input
                    name="discounts"
                    value={editForm.discounts}
                    onChange={handleEditInputChange}
                    className="crm-input"
                    placeholder="e.g. Military, Safe Driver"
                  />
                </div>
                <div>
                  <label className="meta-text">Renewal Date</label>
                  <input
                    name="renewalDate"
                    value={editForm.renewalDate}
                    onChange={handleEditInputChange}
                    className="crm-input"
                    placeholder="e.g. 12/18/2025"
                  />
                </div>
              </div>

              <div style={{ marginTop: "0.75rem" }}>
                <label className="meta-text">
                  Vehicles (one per line, e.g. &quot;2019 Ford F-150&quot;)
                </label>
                <textarea
                  name="vehicles"
                  value={editForm.vehicles}
                  onChange={handleEditInputChange}
                  className="crm-input"
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: "right" }}>
              <button
                className="btn-secondary"
                onClick={handleCancelEdit}
                style={{ marginRight: "0.5rem" }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </section>
        )}

        {/* Main Content */}
        <main className="crm-main">
          {/* Customer Summary Card */}
          <section className="card card-summary">
            <div className="card-summary-left">
              <h2 className="customer-name">{customer.name}</h2>
              <p>
                Policy #: <strong>{policyNumber}</strong>
              </p>
              <p>
                Status:{" "}
                <span className="status-pill status-active">
                  {customer.status || "Active"}
                </span>
              </p>
              <p>
                Assigned Agent:{" "}
                <strong>{customer.agent || "Unassigned"}</strong>
              </p>
            </div>
            <div className="card-summary-right">
              <p>
                Phone:{" "}
                {customer.phone ? (
                  <a href={getPhoneHref(customer.phone)}>{customer.phone}</a>
                ) : (
                  "—"
                )}
              </p>
              <p>
                Email:{" "}
                {customer.email ? (
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                ) : (
                  "—"
                )}
              </p>
              <p>Location: {customer.zip || "—"}</p>
              <p className="meta-text">Created: {customer.when}</p>
            </div>
          </section>

          {/* Two Column Section: Contact + Policy */}
          <section className="grid-two">
            {/* Contact Info Card */}
            <section className="card">
              <div className="card-header">
                <h3>Contact Info</h3>
              </div>
              <div className="card-body">
                <dl className="details-list">
                  <div>
                    <dt>Name</dt>
                    <dd>{customer.name || "—"}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{customer.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{customer.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{customer.zip ? `ZIP: ${customer.zip}` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Date of Birth</dt>
                    <dd>{customer.dob || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="card-footer">
                <button
                  className="link-button"
                  onClick={handleEditContactDetails}
                >
                  Edit contact details
                </button>
              </div>
            </section>

            {/* Policy Details Card */}
            <section className="card">
              <div className="card-header">
                <h3>Policy Details</h3>
              </div>
              <div className="card-body">
                <dl className="details-list">
                  <div>
                    <dt>Policy #</dt>
                    <dd>{policyNumber}</dd>
                  </div>
                  <div>
                    <dt>Coverage</dt>
                    <dd>{coverageText}</dd>
                  </div>
                  <div>
                    <dt>Vehicles</dt>
                    <dd>
                      {vehicleLines.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="policy-vehicle-list">
                          {vehicleLines.map((v) => (
                            <li key={v}>{v}</li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Deductibles</dt>
                    <dd>{deductiblesText}</dd>
                  </div>
                  <div>
                    <dt>Discounts</dt>
                    <dd>{discountsText}</dd>
                  </div>
                  <div>
                    <dt>Renewal Date</dt>
                    <dd>{renewalText}</dd>
                  </div>
                </dl>
              </div>
              <div className="card-footer">
                <button className="link-button" onClick={handleViewFullPolicy}>
                  View full policy info
                </button>
              </div>
            </section>
          </section>

          {/* Billing & Payments */}
          <section className="card">
            <div className="card-header card-header-with-actions">
              <div>
                <h3>Billing &amp; Payments</h3>
                <p className="subtitle">
                  Manage billing status, payment method, and history.
                </p>
              </div>
              <div className="card-actions">
                <button
                  className="btn-primary"
                  onClick={handleCollectFirstPayment}
                >
                  Collect First Payment
                </button>
                <button
                  className="btn-outline"
                  onClick={handleStartMonthlyBilling}
                >
                  Start Monthly Billing
                </button>
                <button
                  className="btn-outline"
                  onClick={handleChargeCustomerNow}
                >
                  Charge Customer Now
                </button>
              </div>
            </div>

            <div className="card-body billing-layout">
              {/* Billing Overview */}
              <div className="billing-overview">
                <h4>Billing Overview</h4>
                <dl className="details-list">
                  <div>
                    <dt>Billing Status</dt>
                    <dd>
                      <span className="status-pill status-active">Active</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Monthly Amount</dt>
                    <dd>$189.00</dd>
                  </div>
                  <div>
                    <dt>Next Billing Date</dt>
                    <dd>March 12, 2025</dd>
                  </div>
                </dl>
              </div>

              {/* Payment Method */}
              <div className="payment-method">
                <h4>Payment Method on File</h4>
                <p>Card: Visa •••• 1234</p>
                <p>Name on Card: {customer.name || "—"}</p>
                <p className="meta-text">Last updated: Jan 12, 2025</p>
                <button className="link-button" onClick={handleUpdateCard}>
                  Update card on file
                </button>
              </div>
            </div>

            {/* Payment History */}
            <div className="card-subsection">
              <div className="card-subheader">
                <h4>Payment History</h4>
                <button className="link-button" onClick={handleViewAllPayments}>
                  View all
                </button>
              </div>
              <div className="table-wrapper">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Static placeholders for now – later we can map real Stripe history */}
                    <tr>
                      <td>Feb 12, 2025</td>
                      <td>$189.00</td>
                      <td>Auto Billing (Visa)</td>
                      <td>
                        <span className="status-pill status-active">Paid</span>
                      </td>
                      <td>
                        <button
                          className="link-button"
                          onClick={handleViewReceipt}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Jan 12, 2025</td>
                      <td>$189.00</td>
                      <td>Card on File</td>
                      <td>
                        <span className="status-pill status-active">Paid</span>
                      </td>
                      <td>
                        <button
                          className="link-button"
                          onClick={handleViewReceipt}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Activity Log */}
          <section className="card">
            <div className="card-header card-header-with-actions">
              <h3>Activity Log</h3>
              <button className="btn-secondary" onClick={handleAddNote}>
                + Add Note
              </button>
            </div>
            <div className="card-body activity-log">
              {activityNotes.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No notes yet. Click &quot;Add Note&quot; to record an update
                  for this customer.
                </p>
              ) : (
                activityNotes.map((note) => (
                  <article key={note.id} className="activity-item">
                    <div className="activity-meta">
                      <span className="activity-date">{note.createdAt}</span>
                      <span className="activity-agent">{note.agent}</span>
                    </div>
                    <p>{note.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Optional: Files / Documents */}
          <section className="card">
            <div className="card-header card-header-with-actions">
              <h3>Files &amp; Documents</h3>
              <button className="btn-secondary" onClick={handleUploadFile}>
                Upload New File
              </button>
            </div>
            <div className="card-body">
              <ul className="file-list">
                <li>
                  <span>Quote PDF</span>
                  <div className="file-actions">
                    <button className="link-button" onClick={handleViewFile}>
                      View
                    </button>
                    <button
                      className="link-button"
                      onClick={handleDownloadFile}
                    >
                      Download
                    </button>
                  </div>
                </li>
                <li>
                  <span>ID Cards</span>
                  <div className="file-actions">
                    <button className="link-button" onClick={handleViewFile}>
                      View
                    </button>
                    <button
                      className="link-button"
                      onClick={handleDownloadFile}
                    >
                      Download
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </main>
      </div>

      {/* Global styles for this CRM layout */}
      <style jsx global>{`
        :root {
          --bg-page: #f3f4f6;
          --bg-card: #ffffff;
          --border-subtle: #e5e7eb;
          --text-main: #111827;
          --text-muted: #6b7280;
          --primary: #dc2626; /* Apex red-style color */
          --primary-soft: #fee2e2;
          --accent: #2563eb;
          --radius-lg: 0.75rem;
          --shadow-soft: 0 10px 25px rgba(15, 23, 42, 0.06);
        }

        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          margin: 0;
          background: var(--bg-page);
          color: var(--text-main);
        }

        .crm-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .crm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          gap: 1rem;
        }

        .crm-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .crm-header-title h1 {
          margin: 0;
          font-size: 1.4rem;
        }

        .crm-breadcrumb {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .crm-header-right {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .crm-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-soft);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
        }

        .card-summary {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1.25rem 1.5rem;
        }

        .card-summary-left h2 {
          margin: 0 0 0.25rem;
        }

        .card-summary-left p,
        .card-summary-right p {
          margin: 0.1rem 0;
        }

        .card-summary-right {
          text-align: right;
          font-size: 0.9rem;
        }

        .meta-text {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .card-header,
        .card-subheader {
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }

        .card-header h3,
        .card-subheader h4 {
          margin: 0;
          font-size: 1rem;
        }

        .card-header-with-actions {
          padding: 0.9rem 1.25rem;
        }

        .card-actions {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .card-body {
          padding: 1rem 1.25rem;
        }

        .card-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border-subtle);
          text-align: right;
        }

        .card-subsection {
          padding: 0 1.25rem 1rem;
        }

        .subtitle {
          margin: 0.2rem 0 0;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .grid-two {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1rem;
        }

        .details-list {
          margin: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.4rem;
        }

        .details-list div {
          display: grid;
          grid-template-columns: 120px minmax(0, 1fr);
          column-gap: 0.5rem;
          row-gap: 0.1rem;
          font-size: 0.9rem;
        }

        dt {
          font-weight: 600;
          color: var(--text-muted);
        }

        dd {
          margin: 0;
        }

        .billing-layout {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
          gap: 1rem;
        }

        .billing-overview h4,
        .payment-method h4 {
          margin: 0 0 0.5rem;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 0.75rem;
        }

        .crm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        .crm-table th,
        .crm-table td {
          padding: 0.5rem 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
          text-align: left;
          white-space: nowrap;
        }

        .crm-table th {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .activity-log {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-item {
          padding: 0.6rem 0;
          border-bottom: 1px dashed var(--border-subtle);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.2rem;
        }

        .activity-agent {
          font-weight: 600;
        }

        .file-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.9rem;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Vehicles list in Policy card */
        .policy-vehicle-list {
          list-style: disc;
          padding-left: 1.1rem;
          margin: 0;
        }

        .policy-vehicle-list li {
          margin: 0;
          padding: 0;
        }

        /* Buttons */
        .btn-primary,
        .btn-secondary,
        .btn-outline,
        .link-button {
          font-family: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 999px;
          border: none;
          padding: 0.4rem 0.9rem;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
          border: 1px solid var(--primary);
        }

        .btn-primary:hover {
          background: #b91c1c;
        }

        .btn-secondary {
          background: #f9fafb;
          color: var(--text-main);
          border: 1px solid var(--border-subtle);
        }

        .btn-secondary:hover {
          background: #eef2ff;
        }

        .btn-outline {
          background: #fff;
          color: var(--text-main);
          border: 1px solid var(--border-subtle);
        }

        .btn-outline:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .link-button {
          background: transparent;
          border: none;
          color: var(--accent);
          padding: 0;
        }

        .link-button:hover {
          text-decoration: underline;
        }

        /* Status pills */
        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.1rem 0.55rem;
          font-size: 0.75rem;
          border-radius: 999px;
          font-weight: 600;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-warning {
          background: #fef9c3;
          color: #854d0e;
        }

        .status-error {
          background: #fee2e2;
          color: #b91c1c;
        }

        /* Simple input style for edit panel */
        .crm-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--border-subtle);
          padding: 0.35rem 0.5rem;
          font-size: 0.85rem;
        }

        .crm-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary-soft);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .card-summary {
            flex-direction: column;
            align-items: flex-start;
          }

          .card-summary-right {
            text-align: left;
          }

          .grid-two {
            grid-template-columns: minmax(0, 1fr);
          }

          .billing-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .crm-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .crm-header-right {
            align-self: stretch;
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
}
