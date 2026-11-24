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

  const totalRevenue = filtered.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalVolume = filtered.reduce((acc, t) => acc + (t.unitsPurchased || 0), 0);
  const confirmedCount = filtered.filter((t) => t.paymentStatus === "Confirmed").length;
  const pendingTokensCount = filtered.filter((t) => t.tokenStatus === "Pending").length;
  const failedTxCount = filtered.filter((t) => t.paymentStatus === "Failed").length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #082f49 0%, #0c4a6e 35%, #0284c7 70%, #0ea5e9 100%)",
          borderRadius: 20,
          padding: "32px 36px",
          position: "relative",
          overflow: "hidden",
          color: "#ffffff",
          boxShadow: "0 10px 30px -10px rgba(2, 132, 199, 0.4)",
        }}
      >
        <div style={{ position: "absolute", right: -50, top: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, bottom: -60, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                💧 Maji Ledger
              </div>
              <div style={{ background: "rgba(14,165,233,0.5)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(255,255,255,0.2)" }}>
                Prepaid Water Transactions
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Prepaid Vending & Purchases Ledger
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              Authoritative transaction records, M-Pesa mobile money receipts, STS tokens, and volume telemetry.
            </p>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Total Water Revenue", value: formatKes(totalRevenue), icon: "💰" },
            { label: "Total Volume Sold", value: `${totalVolume.toFixed(1)} m³`, icon: "📦" },
            { label: "Confirmed Orders", value: confirmedCount, icon: "✅" },
            { label: "Pending Tokens", value: pendingTokensCount, icon: "🔑" },
            { label: "Failed Payments", value: failedTxCount, icon: "⚠️" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                padding: "8px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 120,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                {s.icon} {s.label}
              </span>
              <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Vended Revenue
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {formatKes(totalRevenue)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {confirmedCount} confirmed M-Pesa purchases
              </div>
            </div>
            <div style={{ background: "#e0f2fe", borderRadius: 12, padding: "10px 12px", border: "1px solid #bae6fd" }}>
              <CreditCard size={22} color="#0284c7" />
            </div>
          </div>
          <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#166534", fontWeight: 600 }}>
            Avg Ticket: {confirmedCount > 0 ? formatKes(Math.round(totalRevenue / confirmedCount)) : "KES 0"} per order
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0", boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Volume Telemetry
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {totalVolume.toFixed(2)} <span style={{ fontSize: 16, color: "#64748b" }}>m³</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Dispatched to smart prepaid meters
              </div>
            </div>
            <div style={{ background: "#ecfdf5", borderRadius: 12, padding: "10px 12px", border: "1px solid #a7f3d0" }}>
              <CheckCircle2 size={22} color="#059669" />
            </div>
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#334155", fontWeight: 600 }}>
            {((totalVolume * 1000)).toLocaleString()} Liters of water purchased
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: `1px solid ${pendingTokensCount > 0 ? "#fed7aa" : "#e2e8f0"}`, boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: pendingTokensCount > 0 ? "#d97706" : "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Token Vending Queue
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: pendingTokensCount > 0 ? "#d97706" : "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {pendingTokensCount} <span style={{ fontSize: 16, color: "#64748b" }}>Pending</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {pendingTokensCount > 0 ? "Awaiting STS token generation / SMS" : "All confirmed tokens generated & delivered"}
              </div>
            </div>
            <div style={{ background: pendingTokensCount > 0 ? "#fffbeb" : "#f0fdf4", borderRadius: 12, padding: "10px 12px", border: `1px solid ${pendingTokensCount > 0 ? "#fde68a" : "#bbf7d0"}` }}>
              {pendingTokensCount > 0 ? <Clock size={22} color="#d97706" /> : <CheckCircle2 size={22} color="#059669" />}
            </div>
          </div>
          <div style={{ background: pendingTokensCount > 0 ? "#fffbeb" : "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: pendingTokensCount > 0 ? "#b45309" : "#166534", fontWeight: 600 }}>
            {pendingTokensCount > 0 ? "Action required in token queue" : "0 pending deliveries in queue"}
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px -2px rgba(0,0,0,0.04)",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
            <Search
              size={15}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              type="text"
              placeholder="Search reference, M-Pesa code, meter, phone, or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px 9px 36px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                outline: "none",
                background: "#f8fafc",
                color: "#0f172a",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              fontSize: 13,
              outline: "none",
              background: "#f8fafc",
              color: "#0f172a",
              cursor: "pointer",
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
              padding: "8px 12px",
              borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              fontSize: 13,
              outline: "none",
              background: "#f8fafc",
              color: "#0f172a",
              cursor: "pointer",
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
              padding: "8px 12px",
              borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              fontSize: 13,
              outline: "none",
              background: "#f8fafc",
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            <option value="">All Properties ({properties.length})</option>
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
              padding: "8px 14px",
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "#475569",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
          Showing <span style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</span> records
        </div>
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
