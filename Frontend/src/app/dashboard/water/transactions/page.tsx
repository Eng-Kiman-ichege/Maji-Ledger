"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type {
  WaterTransactionDto,
  WaterTransactionPaymentStatus,
  WaterTransactionTokenStatus,
  PropertyDto,
} from "@/types/domain";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Key,
  Copy,
  Building2,
  Phone,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Confirmed: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  Pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Failed: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  Reversed: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

const TOKEN_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Delivered: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  Generated: { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
  Pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  Failed: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  NotRequired: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

export default function WaterTransactionsPage() {
  const [transactions, setTransactions] = useState<WaterTransactionDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [tokenStatusFilter, setTokenStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");

  // Manual token modal
  const [selectedTx, setSelectedTx] = useState<WaterTransactionDto | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
    loadProperties();
  }, [paymentStatusFilter, tokenStatusFilter, propertyFilter]);

  const loadProperties = async () => {
    try {
      const res = await api.get<PropertyDto[]>("/api/v1/properties");
      setProperties(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentStatusFilter) params.append("paymentStatus", paymentStatusFilter);
      if (tokenStatusFilter) params.append("tokenStatus", tokenStatusFilter);
      if (propertyFilter) params.append("propertyId", propertyFilter);
      const res = await api.get<WaterTransactionDto[]>(
        `/api/v1/water/transactions?${params.toString()}`
      );
      setTransactions(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    setSubmitting(true);
    setActionError("");
    try {
      await api.post(`/api/v1/water/transactions/${selectedTx.id}/manual-token`, {
        token: manualToken.trim(),
        notes: manualNotes.trim() || null,
      });
      setSelectedTx(null);
      setManualToken("");
      setManualNotes("");
      await loadTransactions();
    } catch (err: any) {
      setActionError(err?.message || "Failed to submit manual token");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatKes = (amount: number) => {
    return `KES ${Number(amount || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.transactionReference.toLowerCase().includes(q) ||
      (t.externalTransactionReference && t.externalTransactionReference.toLowerCase().includes(q)) ||
      t.meterNumber.toLowerCase().includes(q) ||
      t.phoneNumber.toLowerCase().includes(q) ||
      (t.tenantName && t.tenantName.toLowerCase().includes(q)) ||
      t.propertyName.toLowerCase().includes(q) ||
      t.unitNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0284c7",
                background: "#f0f9ff",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1px solid #bae6fd",
                textTransform: "uppercase",
              }}
            >
              Water Ledger
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Water Transactions Ledger
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>
            Authoritative prepaid water purchase ledger separated from rent accounts
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search reference, M-Pesa code, meter, phone, or tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            outline: "none",
            background: "#fff",
            color: "#334155",
          }}
        >
          <option value="">All Payment Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Reversed">Reversed</option>
        </select>

        <select
          value={tokenStatusFilter}
          onChange={(e) => setTokenStatusFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            outline: "none",
            background: "#fff",
            color: "#334155",
          }}
        >
          <option value="">All Token Statuses</option>
          <option value="Delivered">Delivered</option>
          <option value="Generated">Generated</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="NotRequired">Not Required</option>
        </select>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            outline: "none",
            background: "#fff",
            color: "#334155",
          }}
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.propertyName || p.name}
            </option>
          ))}
        </select>

        <button
          onClick={loadTransactions}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            color: "#475569",
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading water transactions...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <CreditCard size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No water transactions found</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              Transactions appear when tenants purchase prepaid water tokens via M-Pesa, Airtel, or cash.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Ref / Date</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Property & Unit</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Meter #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Customer / Phone</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Provider & Code</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Amount & Units</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>STS Token</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const payBadge = PAYMENT_STATUS_CONFIG[t.paymentStatus] || PAYMENT_STATUS_CONFIG.Pending;
                  const tokBadge = TOKEN_STATUS_CONFIG[t.tokenStatus] || TOKEN_STATUS_CONFIG.Pending;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.transactionReference}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          {new Date(t.transactionDate).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{t.propertyName}</div>
                        <div style={{ fontSize: 12, color: "#0284c7", fontWeight: 600 }}>Unit {t.unitNumber}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: "monospace",
                            background: "#f1f5f9",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {t.meterNumber}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500, color: "#334155" }}>{t.tenantName || "Walk-in Tenant"}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{t.phoneNumber}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#334155" }}>{t.paymentMethod}</div>
                        <div style={{ fontSize: 12, color: "#0284c7", fontFamily: "monospace" }}>
                          {t.externalTransactionReference || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 800, color: "#059669" }}>{formatKes(t.amount)}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{Number(t.unitsPurchased).toFixed(2)} m³</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 600,
                              color: payBadge.color,
                              background: payBadge.bg,
                              border: `1px solid ${payBadge.border}`,
                              textAlign: "center",
                            }}
                          >
                            Pay: {t.paymentStatus}
                          </span>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 600,
                              color: tokBadge.color,
                              background: tokBadge.bg,
                              border: `1px solid ${tokBadge.border}`,
                              textAlign: "center",
                            }}
                          >
                            Token: {t.tokenStatus}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {t.tokenValue ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <code
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#0284c7",
                                background: "#f0f9ff",
                                padding: "3px 6px",
                                borderRadius: 4,
                                border: "1px solid #bae6fd",
                              }}
                            >
                              {t.tokenValue}
                            </code>
                            <button
                              onClick={() => handleCopy(t.tokenValue!, t.id)}
                              style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                color: copiedId === t.id ? "#059669" : "#94a3b8",
                              }}
                              title="Copy Token"
                            >
                              {copiedId === t.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                            {t.failureReason || "No token"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        {t.paymentStatus === "Confirmed" && (!t.tokenValue || t.tokenStatus === "Failed") ? (
                          <button
                            onClick={() => {
                              setSelectedTx(t);
                              setManualToken("");
                              setManualNotes("");
                              setActionError("");
                            }}
                            style={{
                              padding: "6px 10px",
                              background: "#fef3c7",
                              border: "1px solid #fde68a",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#d97706",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Key size={13} /> Manual Token
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Enter Manual Token */}
      {selectedTx && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 480,
              width: "100%",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Issue Manual STS Token
                </h2>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  Tx: {selectedTx.transactionReference} · Meter: {selectedTx.meterNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                padding: "12px 14px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <div>
                Customer: <strong>{selectedTx.tenantName || selectedTx.phoneNumber}</strong>
              </div>
              <div>
                Amount: <strong>{formatKes(selectedTx.amount)}</strong> ({Number(selectedTx.unitsPurchased).toFixed(2)} m³)
              </div>
              <div>
                Provider Ref: <strong>{selectedTx.externalTransactionReference || "N/A"}</strong>
              </div>
            </div>

            {actionError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  color: "#dc2626",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {actionError}
              </div>
            )}

            <form onSubmit={handleManualTokenSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  STS Token Code (e.g. 20-digit prepaid code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234-5678-9012-3456-7890"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Operator Audit Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for manual generation, operator name, etc."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "9px 20px",
                    background: "#0284c7",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Issuing..." : "Confirm & Save Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
