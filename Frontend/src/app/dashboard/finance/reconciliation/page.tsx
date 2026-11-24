"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { ReconciliationSessionDto, ReconciliationLedgerType } from "@/types/domain";
import {
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Upload,
} from "lucide-react";

export default function FinancialReconciliationPage() {
  const [sessions, setSessions] = useState<ReconciliationSessionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [ledgerType, setLedgerType] = useState<ReconciliationLedgerType>("Rent");
  const [periodFrom, setPeriodFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [rawStatement, setRawStatement] = useState(
    JSON.stringify(
      [
        { reference: "MPESA-001", amount: 25000, date: new Date().toISOString(), channel: "Mpesa" },
        { reference: "BANK-002", amount: 15000, date: new Date().toISOString(), channel: "BankTransfer" },
      ],
      null,
      2
    )
  );

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get<ReconciliationSessionDto[]>("/api/v1/finance/reconciliation/sessions");
      setSessions(res || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(rawStatement);
      } catch {
        alert("Statement data must be valid JSON array of items: [{ reference, amount, date, channel }]");
        setSubmitting(false);
        return;
      }

      await api.post("/api/v1/finance/reconciliation/process", {
        ledgerType,
        periodFrom: new Date(periodFrom).toISOString(),
        periodTo: new Date(periodTo).toISOString(),
        externalItems: parsedItems,
        notes: notes || undefined,
      });

      setShowModal(false);
      fetchSessions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Reconciliation processing failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0369a1", background: "#e0f2fe", padding: "3px 8px", borderRadius: 6 }}>
            Treasury & Audit
          </span>
          <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Financial Reconciliation
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Automated three-way matching of Bank/M-Pesa statements against the internal Rent Ledger.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/dashboard/finance/discrepancies"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", textDecoration: "none" }}
          >
            <AlertTriangle size={15} color="#f59e0b" /> Discrepancies Queue
          </Link>
          <Link
            href="/dashboard/finance/reports"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#334155", textDecoration: "none" }}
          >
            <FileText size={15} color="#0284c7" /> Consolidated Reports
          </Link>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={16} /> Run Reconciliation Session
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Reconciliation History & Audit Sessions</h3>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <RefreshCw size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>No reconciliation sessions run yet</div>
            <p style={{ fontSize: 13, margin: "4px 0 0" }}>Click above to run automated matching for Rent or Water ledgers.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px" }}>Ledger</th>
                <th style={{ padding: "12px 16px" }}>Period</th>
                <th style={{ padding: "12px 16px" }}>Scope</th>
                <th style={{ padding: "12px 16px" }}>Internal Total</th>
                <th style={{ padding: "12px 16px" }}>External Total</th>
                <th style={{ padding: "12px 16px" }}>Variance</th>
                <th style={{ padding: "12px 16px" }}>Matched / Unmatched</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                    {s.ledgerType}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>
                    {new Date(s.periodFrom).toLocaleDateString()} – {new Date(s.periodTo).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>
                    {s.propertyName ?? "Portfolio"}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>
                    KES {s.totalInternalAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>
                    KES {s.totalExternalAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: s.discrepancyAmount !== 0 ? "#dc2626" : "#059669" }}>
                    KES {s.discrepancyAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>
                    <span style={{ color: "#059669", fontWeight: 600 }}>{s.matchedCount}</span> / <span style={{ color: s.unmatchedCount > 0 ? "#dc2626" : "#64748b", fontWeight: 600 }}>{s.unmatchedCount}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: s.status === "Matched" ? "#dcfce7" : s.status === "Resolved" ? "#e0f2fe" : "#fee2e2",
                        color: s.status === "Matched" ? "#166534" : s.status === "Resolved" ? "#0369a1" : "#991b1b",
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {s.unmatchedCount > 0 && (
                      <Link
                        href={`/dashboard/finance/discrepancies?sessionId=${s.id}`}
                        style={{ fontSize: 12, fontWeight: 600, color: "#0284c7", textDecoration: "none" }}
                      >
                        Inspect →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Session Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#ffffff", borderRadius: 14, padding: 24, maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                Execute Reconciliation Matching
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleStartReconciliation} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Target Financial Ledger
                </label>
                <select
                  value={ledgerType}
                  onChange={(e) => setLedgerType(e.target.value as ReconciliationLedgerType)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="Rent">Rent Ledger (Confirmed Payments)</option>
                  <option value="Water">Water Ledger (Purchases & Vended Tokens)</option>
                  <option value="Consolidated">Consolidated (Both Ledgers)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                    Period From
                  </label>
                  <input
                    type="date"
                    required
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                    Period To
                  </label>
                  <input
                    type="date"
                    required
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  External Statement Data (JSON Array)
                </label>
                <textarea
                  rows={6}
                  required
                  value={rawStatement}
                  onChange={(e) => setRawStatement(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, fontFamily: "monospace" }}
                />
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Items must include: <code>reference</code>, <code>amount</code>, <code>date</code>, and optional <code>channel</code>.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. End of month bank batch reconciliation"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#0284c7", color: "#ffffff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  {submitting ? "Matching..." : "Run Reconciliation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
