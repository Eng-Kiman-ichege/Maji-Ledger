"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import type { DiscrepancyDto, DiscrepancyStatus } from "@/types/domain";
import { AlertTriangle, CheckCircle, XCircle, Search, Filter } from "lucide-react";

export default function DiscrepanciesPage() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");

  const [discrepancies, setDiscrepancies] = useState<DiscrepancyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");

  // Resolution modal
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyDto | null>(null);
  const [action, setAction] = useState<"Resolve" | "Ignore">("Resolve");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscrepancies();
  }, [sessionIdParam, statusFilter]);

  const fetchDiscrepancies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sessionIdParam) params.append("sessionId", sessionIdParam);
      if (statusFilter && statusFilter !== "All") params.append("status", statusFilter);

      const res = await api.get<DiscrepancyDto[]>(`/api/v1/finance/reconciliation/discrepancies?${params.toString()}`);
      setDiscrepancies(res || []);
    } catch {
      setDiscrepancies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscrepancy || !resolutionNotes.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/api/v1/finance/reconciliation/discrepancies/${selectedDiscrepancy.id}/resolve`, {
        action,
        resolutionNotes: resolutionNotes.trim(),
      });
      setSelectedDiscrepancy(null);
      setResolutionNotes("");
      fetchDiscrepancies();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to resolve discrepancy.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309", background: "#fef3c7", padding: "3px 8px", borderRadius: 6 }}>
          Variance Resolution
        </span>
        <h1 style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
          Reconciliation Discrepancy Queue
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Audit exceptions, missing external bank credits, and ledger amount variances.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {["Pending", "Resolved", "Ignored", "All"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: statusFilter === st ? "1px solid #0284c7" : "1px solid #e2e8f0",
              background: statusFilter === st ? "#0284c7" : "#ffffff",
              color: statusFilter === st ? "#ffffff" : "#475569",
              fontSize: 13,
              fontWeight: statusFilter === st ? 600 : 500,
              cursor: "pointer",
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading discrepancies...</div>
        ) : discrepancies.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <CheckCircle size={32} color="#059669" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>No discrepancies found</div>
            <p style={{ fontSize: 13, margin: "4px 0 0" }}>All transactions in this scope are fully balanced.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px" }}>Reference</th>
                <th style={{ padding: "12px 16px" }}>Internal Amount</th>
                <th style={{ padding: "12px 16px" }}>External Amount</th>
                <th style={{ padding: "12px 16px" }}>Variance</th>
                <th style={{ padding: "12px 16px" }}>Reason</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discrepancies.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                    {d.transactionReference}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>
                    KES {d.internalAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>
                    KES {d.externalAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#dc2626" }}>
                    KES {Math.abs(d.internalAmount - d.externalAmount).toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b", maxWidth: 300 }}>
                    {d.discrepancyReason}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: d.status === "Resolved" ? "#dcfce7" : d.status === "Ignored" ? "#f1f5f9" : "#fee2e2",
                        color: d.status === "Resolved" ? "#166534" : d.status === "Ignored" ? "#64748b" : "#991b1b",
                      }}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {d.status === "Pending" ? (
                      <button
                        onClick={() => setSelectedDiscrepancy(d)}
                        style={{ padding: "5px 12px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Resolve
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{d.resolutionNotes ?? "Closed"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedDiscrepancy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#ffffff", borderRadius: 14, padding: 24, maxWidth: 500, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                Resolve Reconciliation Variance
              </h3>
              <button onClick={() => setSelectedDiscrepancy(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>✕</button>
            </div>

            <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <div><strong>Reference:</strong> {selectedDiscrepancy.transactionReference}</div>
              <div><strong>Internal Ledger:</strong> KES {selectedDiscrepancy.internalAmount.toLocaleString()}</div>
              <div><strong>External Statement:</strong> KES {selectedDiscrepancy.externalAmount.toLocaleString()}</div>
              <div style={{ color: "#b45309", marginTop: 4 }}><strong>Flagged Reason:</strong> {selectedDiscrepancy.discrepancyReason}</div>
            </div>

            <form onSubmit={handleResolve} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as "Resolve" | "Ignore")}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                >
                  <option value="Resolve">Resolve (Adjust ledger or record explanation)</option>
                  <option value="Ignore">Ignore (False positive / benign difference)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Resolution Notes (Audit Trail)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this variance occurred and what action was taken..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedDiscrepancy(null)}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#059669", color: "#ffffff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  {submitting ? "Saving..." : "Confirm Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
