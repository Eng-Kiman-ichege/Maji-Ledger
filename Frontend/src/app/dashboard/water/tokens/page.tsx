"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { WaterTransactionDto } from "@/types/domain";
import {
  Key,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";

export default function WaterTokensPage() {
  const [tokens, setTokens] = useState<WaterTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, [statusFilter]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Only fetch confirmed transactions where token generation is relevant
      params.append("paymentStatus", "Confirmed");
      if (statusFilter) params.append("tokenStatus", statusFilter);
      const res = await api.get<WaterTransactionDto[]>(
        `/api/v1/water/transactions?${params.toString()}`
      );
      setTokens(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = tokens.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.tokenValue && t.tokenValue.toLowerCase().includes(q)) ||
      t.meterNumber.toLowerCase().includes(q) ||
      t.phoneNumber.toLowerCase().includes(q) ||
      t.transactionReference.toLowerCase().includes(q) ||
      (t.tenantName && t.tenantName.toLowerCase().includes(q))
    );
  });

  const totalGenerated = tokens.filter((t) => t.tokenValue).length;
  const deliveredCount = tokens.filter((t) => t.tokenStatus === "Delivered").length;
  const pendingCount = tokens.filter((t) => t.tokenStatus === "Pending").length;
  const failedCount = tokens.filter((t) => t.tokenStatus === "Failed").length;

  const totalCount = tokens.length;
  const deliveryPct = totalGenerated > 0 ? Math.round((deliveredCount / totalGenerated) * 100) : 100;

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
                STS Vending Hub
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              STS 20-Digit Token Dispatch & Queue
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>
              IEC 62055-41 STS token generation logs, SMS delivery gateways, and manual token copy actions.
            </p>
          </div>
        </div>

        {/* Quick stat pills */}
        <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Tokens Generated", value: totalGenerated, icon: "🔑" },
            { label: "Delivered via SMS", value: deliveredCount, icon: "📲" },
            { label: "Delivery Rate", value: `${deliveryPct}%`, icon: "📈" },
            { label: "Pending Delivery", value: pendingCount, icon: "⏳" },
            { label: "Failed Attempts", value: failedCount, icon: "⚠️" },
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
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                SMS Delivery Rate
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {deliveryPct}<span style={{ fontSize: 18, color: "#64748b" }}>%</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {deliveredCount} delivered out of {totalGenerated} tokens
              </div>
            </div>
            <div style={{ background: "#ecfdf5", borderRadius: 12, padding: "10px 12px", border: "1px solid #a7f3d0" }}>
              <CheckCircle2 size={22} color="#059669" />
            </div>
          </div>
          <div style={{ background: "#f1f5f9", borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${deliveryPct}%`, height: "100%", background: "#059669", borderRadius: 8 }} />
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: `1px solid ${pendingCount > 0 ? "#fed7aa" : "#e2e8f0"}`, boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: pendingCount > 0 ? "#d97706" : "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Pending SMS Delivery
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: pendingCount > 0 ? "#d97706" : "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {pendingCount} <span style={{ fontSize: 16, color: "#64748b" }}>Queued</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {pendingCount > 0 ? "Tokens queued for telecommunications gateway" : "SMS outbound queue empty"}
              </div>
            </div>
            <div style={{ background: pendingCount > 0 ? "#fffbeb" : "#f0fdf4", borderRadius: 12, padding: "10px 12px", border: `1px solid ${pendingCount > 0 ? "#fde68a" : "#bbf7d0"}` }}>
              <Clock size={22} color={pendingCount > 0 ? "#d97706" : "#059669"} />
            </div>
          </div>
          <div style={{ background: pendingCount > 0 ? "#fffbeb" : "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: pendingCount > 0 ? "#b45309" : "#166534", fontWeight: 600 }}>
            {pendingCount > 0 ? "Auto-retry enabled every 60 seconds" : "All SMS tokens delivered to tenants"}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 22, border: `1px solid ${failedCount > 0 ? "#fecaca" : "#e2e8f0"}`, boxShadow: "0 4px 18px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: failedCount > 0 ? "#dc2626" : "#059669", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Failed Generations
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: failedCount > 0 ? "#dc2626" : "#0f172a", lineHeight: 1.1, marginTop: 4 }}>
                {failedCount} <span style={{ fontSize: 16, color: "#64748b" }}>Alerts</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {failedCount > 0 ? "Tokens needing manual intervention" : "Zero token vending generation failures"}
              </div>
            </div>
            <div style={{ background: failedCount > 0 ? "#fef2f2" : "#ecfdf5", borderRadius: 12, padding: "10px 12px", border: `1px solid ${failedCount > 0 ? "#fecaca" : "#a7f3d0"}` }}>
              {failedCount > 0 ? <AlertTriangle size={22} color="#dc2626" /> : <CheckCircle2 size={22} color="#059669" />}
            </div>
          </div>
          <div style={{ background: failedCount > 0 ? "#fee2e2" : "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: failedCount > 0 ? "#991b1b" : "#166534", fontWeight: 600 }}>
            {failedCount > 0 ? "Check security server STS key derivation" : "STS key derivation healthy"}
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
              placeholder="Search by token code, meter #, customer phone, or transaction ref..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="Generated">Generated (Not yet delivered)</option>
            <option value="Pending">Pending Generation</option>
            <option value="Failed">Failed</option>
          </select>

          <button
            onClick={loadTokens}
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
          Showing <span style={{ color: "#0f172a", fontWeight: 800 }}>{filtered.length}</span> tokens
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
          <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading tokens log...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Key size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No tokens found</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              Tokens will appear when prepaid water purchases are fulfilled.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>STS Token Code</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Meter #</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Customer & Phone</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Units Purchased</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Generated At</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      {t.tokenValue ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <code
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0f172a",
                              background: "#f1f5f9",
                              padding: "4px 8px",
                              borderRadius: 4,
                              letterSpacing: "0.05em",
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
                            {copiedId === t.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                          {t.failureReason || "Generation Failed"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0284c7" }}>{t.meterNumber}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {t.propertyName} - Unit {t.unitNumber}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{t.tenantName || "Tenant"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{t.phoneNumber}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#059669" }}>
                        {Number(t.unitsPurchased).toFixed(2)} m³
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>KES {t.amount}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ color: "#334155" }}>{new Date(t.transactionDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(t.transactionDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            t.tokenStatus === "Delivered"
                              ? "#059669"
                              : t.tokenStatus === "Generated"
                              ? "#0284c7"
                              : t.tokenStatus === "Pending"
                              ? "#d97706"
                              : "#dc2626",
                          background:
                            t.tokenStatus === "Delivered"
                              ? "#ecfdf5"
                              : t.tokenStatus === "Generated"
                              ? "#f0f9ff"
                              : t.tokenStatus === "Pending"
                              ? "#fffbeb"
                              : "#fef2f2",
                          border: `1px solid ${
                            t.tokenStatus === "Delivered"
                              ? "#a7f3d0"
                              : t.tokenStatus === "Generated"
                              ? "#bae6fd"
                              : t.tokenStatus === "Pending"
                              ? "#fde68a"
                              : "#fecaca"
                          }`,
                        }}
                      >
                        {t.tokenStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {t.tokenValue && (
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: `Water Token for Meter ${t.meterNumber}`,
                                text: `Your water token is: ${t.tokenValue} (${t.unitsPurchased} m³).`,
                              });
                            } else {
                              handleCopy(t.tokenValue!, t.id);
                            }
                          }}
                          style={{
                            padding: "6px 10px",
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#0284c7",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Send size={12} /> Share
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
